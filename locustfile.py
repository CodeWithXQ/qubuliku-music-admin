# -*- coding: utf-8 -*-
"""
曲不离库 · locust 压测脚本（可选，比 benchmark.py 更专业的分布式压测）

安装 & 运行：
  pip install locust
  locust -f locustfile.py --host http://localhost:8080
      # 打开 http://localhost:8089 填并发数，或：
  locust -f locustfile.py --host http://localhost:8080 --headless -u 100 -r 20 -t 60s

注意：
  - 秒杀压测前先重置 Redis 库存：redis-cli FLUSHDB && redis-cli SET seckill:stock:1 100
  - 歌曲详情需要登录，脚本 on_start 里自动登录拿 token
"""
import time

from locust import HttpUser, between, task


class MusicUser(HttpUser):
    wait_time = between(0, 0.1)  # 无思考时间，纯压测

    def on_start(self):
        # 登录拿 token
        resp = self.client.post(
            "/api/auth/login",
            json={"username": "zhangmingyuan", "password": "admin123"},
        )
        token = resp.json()["data"]["token"]
        self.headers = {"Authorization": f"Bearer {token}"}
        self.user_id = int(time.time() * 1000) + self.__hash__() % 100000

    @task(3)  # 权重 3：主要压歌曲详情（热缓存）
    def song_detail(self):
        self.client.get("/api/songs/1", headers=self.headers, name="歌曲详情")

    @task(1)  # 权重 1：压秒杀
    def seckill(self):
        self.client.post(
            f"/api/seckill/1/do?userId={self.user_id}", name="秒杀下单"
        )
