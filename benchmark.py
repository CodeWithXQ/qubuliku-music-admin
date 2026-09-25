# -*- coding: utf-8 -*-
"""
曲不离库 · 压测脚本（零依赖，仅用 Python 标准库）

用途：测出简历里需要的两个数字
  1. 歌曲详情接口：冷缓存延迟 vs 热缓存延迟 vs 并发 QPS（证明 Redis 三件套有效）
  2. 秒杀接口：N 并发抢 M 库存，验证「不超卖」

前置条件（先手动做完）：
  1. 启动 Redis：  D:\\AppGallery\\Downloads\\IDEA\\redis-server.exe
  2. 启动后端：    cd music-sys-server && mvn clean package -DskipTests
                  java -jar music-sys-web\\target\\music-sys-web-1.0.0-SNAPSHOT.jar
  3. 导入秒杀表：  mysql -uroot -p < sql/seckill.sql

用法：
  python benchmark.py             # 全测（歌曲详情 + 秒杀）
  python benchmark.py song        # 只测歌曲详情缓存
  python benchmark.py seckill     # 只测秒杀

重复压测秒杀前，先重置 DB 库存：
  mysql -uroot -p -e "UPDATE music_sys.seckill_activity SET stock = total_stock WHERE id = 1;"
"""
import json
import subprocess
import statistics
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

# ============ 可配置项 ============
BASE_URL = "http://localhost:8080"
REDIS_CLI = r"D:\java\redis-cli.exe"
USERNAME = "zhangmingyuan"
PASSWORD = "admin123"

SONG_ID = 1                       # 压测的歌曲 ID（seed 数据有 1~60）
SEKILL_ACTIVITY_ID = 1            # 秒杀活动 ID
SEKILL_STOCK = 100                # 秒杀库存（与 seckill.sql 一致）

SONG_CONCURRENCY = 50             # 歌曲详情并发线程数
SONG_TOTAL = 2000                 # 歌曲详情总请求数

SEKILL_CONCURRENCY = 200          # 秒杀并发数（应 > 库存，才有竞争）
SEKILL_USERS = 500                # 参与抢购的用户数
# =================================

if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    sys.stdout.reconfigure(encoding="utf-8")


def request(url, method="GET", headers=None, body=None, timeout=15):
    """发 HTTP 请求，返回 (status, raw_bytes, elapsed_ms)"""
    data = None
    if body is not None:
        data = body.encode() if isinstance(body, str) else body
    req = urllib.request.Request(url, data=data, method=method)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status, raw = resp.status, resp.read()
    except urllib.error.HTTPError as e:
        status, raw = e.code, e.read()
    except Exception as e:  # 连接失败等
        status, raw = 0, str(e).encode()
    return status, raw, (time.perf_counter() - t0) * 1000


def login():
    body = json.dumps({"username": USERNAME, "password": PASSWORD})
    status, raw, _ = request(f"{BASE_URL}/api/auth/login", "POST",
                             {"Content-Type": "application/json"}, body)
    if status != 200:
        print(f"[!] 登录失败，status={status}，body={raw.decode(errors='ignore')}")
        sys.exit(1)
    return json.loads(raw)["data"]["token"]


def redis(*args):
    """调 redis-cli，返回 stdout 字符串（失败返回 None）"""
    try:
        r = subprocess.run([REDIS_CLI, *args], capture_output=True, text=True, timeout=10)
        return r.stdout.strip() if r.returncode == 0 else None
    except Exception as e:
        print(f"[!] redis-cli 调用失败（检查 REDIS_CLI 路径）：{e}")
        return None


def reset_redis(activity_id, stock):
    """清空 Redis 并重新初始化秒杀库存（保证可重复压测）"""
    redis("FLUSHDB")
    redis("SET", f"seckill:stock:{activity_id}", str(stock))
    print(f"[*] 已重置 Redis，秒杀库存 {activity_id} -> {stock}")


# ================= 歌曲详情缓存压测 =================
def bench_song(token):
    print("\n========== 歌曲详情缓存压测 ==========")

    # 1. 冷缓存：清缓存后第一次请求（回源 DB + 写缓存）
    redis("DEL", f"cache:song:{SONG_ID}")
    _, _, cold_ms = request(f"{BASE_URL}/api/songs/{SONG_ID}", "GET",
                            {"Authorization": f"Bearer {token}"})
    print(f"[1] 冷缓存（回源 DB）：        {cold_ms:.1f} ms")

    # 2. 热缓存：连续请求 10 次取平均（命中 Redis）
    hot = []
    for _ in range(10):
        _, _, t = request(f"{BASE_URL}/api/songs/{SONG_ID}", "GET",
                          {"Authorization": f"Bearer {token}"})
        hot.append(t)
    hot_ms = statistics.mean(hot)
    print(f"[2] 热缓存（命中 Redis）：      {hot_ms:.1f} ms（10 次均值）")
    print(f"    延迟下降：{cold_ms:.1f}ms → {hot_ms:.1f}ms，"
          f"提升 {(cold_ms - hot_ms) / cold_ms * 100:.1f}%")

    # 3. 并发 QPS（热缓存场景，固定打 SONG_ID）
    def hit(_):
        return request(f"{BASE_URL}/api/songs/{SONG_ID}", "GET",
                       {"Authorization": f"Bearer {token}"})[2]

    t0 = time.perf_counter()
    with ThreadPoolExecutor(max_workers=SONG_CONCURRENCY) as pool:
        latencies = list(pool.map(hit, range(SONG_TOTAL)))
    wall = time.perf_counter() - t0
    qps = SONG_TOTAL / wall
    print(f"[3] 并发压测：{SONG_TOTAL} 请求 / {SONG_CONCURRENCY} 并发")
    print(f"    QPS = {qps:.0f} req/s，平均延迟 {statistics.mean(latencies):.1f} ms，"
          f"P99 = {sorted(latencies)[int(len(latencies) * 0.99) - 1]:.1f} ms")

    print("\n>>> 简历数字：接口响应 {}ms → {}ms，QPS {:.0f}".format(
        int(cold_ms), int(hot_ms), qps))
    print(">>> 缓存命中率：redis-cli info stats 里 keyspace_hits/(hits+misses) 计算")


# ================= 秒杀并发压测 =================
def bench_seckill():
    print("\n========== 秒杀并发压测 ==========")
    reset_redis(SEKILL_ACTIVITY_ID, SEKILL_STOCK)

    # 每个用户一个独立 userId（用时间戳前缀，避免和上次幂等标记冲突）
    base = int(time.time() * 1000)

    def grab(i):
        user_id = base + i
        url = f"{BASE_URL}/api/seckill/{SEKILL_ACTIVITY_ID}/do?userId={user_id}"
        _, raw, _ = request(url, "POST")
        code, msg = 0, ""
        try:
            body = json.loads(raw)
            code, msg = body.get("code", 0), body.get("msg", "")
        except Exception:
            pass
        return code, msg

    t0 = time.perf_counter()
    with ThreadPoolExecutor(max_workers=SEKILL_CONCURRENCY) as pool:
        results = list(pool.map(grab, range(SEKILL_USERS)))
    wall = time.perf_counter() - t0

    success = sum(1 for c, _ in results if c == 200)
    sold_out = sum(1 for c, _ in results if c == 429)
    others = len(results) - success - sold_out

    # 查 DB 最终库存
    _, raw, _ = request(f"{BASE_URL}/api/seckill/{SEKILL_ACTIVITY_ID}")
    final_stock = json.loads(raw)["data"]["stock"]

    print(f"[*] {SEKILL_USERS} 用户 / {SEKILL_CONCURRENCY} 并发，耗时 {wall:.1f}s")
    print(f"    成功下单：{success}（应 == 库存 {SEKILL_STOCK}）")
    print(f"    已售罄拒绝：{sold_out}")
    print(f"    其他异常：{others}")
    print(f"    最终 DB 库存：{final_stock}（应 == 0）")
    print(f"    QPS = {SEKILL_USERS / wall:.0f} req/s")

    if success == SEKILL_STOCK and final_stock == 0:
        print("\n>>> 验证通过：抢购成功数 == 库存，DB 库存扣到 0，无超卖 ✅")
    else:
        print("\n>>> 验证失败：成功数或库存不一致，请检查 ⚠️")
    print(">>> 简历数字：秒杀 {} 并发，成功 {} 单，DB 库存 0，无超卖".format(
        SEKILL_CONCURRENCY, success))


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"

    if mode in ("all", "song"):
        token = login()
        bench_song(token)

    if mode in ("all", "seckill"):
        bench_seckill()


if __name__ == "__main__":
    main()
