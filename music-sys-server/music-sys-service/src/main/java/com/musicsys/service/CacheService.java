package com.musicsys.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Supplier;

/**
 * 通用缓存查询模板：统一处理 Redis 缓存三大问题。
 * <ul>
 *   <li>缓存穿透：查询结果为空时写入空值标记，短过期，拦截对不存在数据的反复查询</li>
 *   <li>缓存击穿：热点 key 过期瞬间用 setnx 互斥锁，只放一个线程回源 DB，其余自旋等待</li>
 *   <li>缓存雪崩：实际 TTL = 基础值 + 随机偏移，避免大量 key 同一时刻集中过期</li>
 * </ul>
 * Redis 不可用时自动降级直查数据库，核心功能不受影响。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CacheService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    /** 空值缓存标记，用于拦截缓存穿透 */
    private static final String NULL_VALUE = "__NULL__";
    /** 空值缓存 TTL（秒） */
    private static final long NULL_TTL = 60L;

    /** 释放锁 Lua 脚本：仅当 value 匹配时才删除，防止误删他人已续期的锁 */
    private static final DefaultRedisScript<Long> UNLOCK_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            Long.class);

    /**
     * 带缓存的查询模板。
     *
     * @param key     缓存 key
     * @param baseTtl 基础过期时间（秒），实际 TTL 会叠加随机偏移
     * @param loader  数据库查询函数，返回 null 表示数据不存在
     * @param type    返回对象类型
     */
    public <T> T getWithCache(String key, long baseTtl, Supplier<T> loader, Class<T> type) {
        // 1. 先查缓存
        String raw = rawGet(key);
        if (raw != null) {
            if (NULL_VALUE.equals(raw)) return null; // 命中空值缓存
            T value = parse(raw, type);
            if (value != null) return value;         // 命中真实缓存
        }

        // 2. 缓存击穿：互斥锁，只放一个线程回源 DB
        String lockKey = "lock:" + key;
        String lockValue = UUID.randomUUID().toString();
        if (!tryLock(lockKey, lockValue, 5)) {
            // 未抢到锁：短暂自旋重试读缓存，仍没有则降级直查 DB
            for (int i = 0; i < 3; i++) {
                sleep(50);
                raw = rawGet(key);
                if (raw != null) {
                    if (NULL_VALUE.equals(raw)) return null;
                    T value = parse(raw, type);
                    if (value != null) return value;
                }
            }
            return loader.get();
        }

        try {
            // 3. 双重检查：抢到锁后，缓存可能已被其他线程重建
            raw = rawGet(key);
            if (raw != null) {
                if (NULL_VALUE.equals(raw)) return null;
                T value = parse(raw, type);
                if (value != null) return value;
            }

            // 4. 回源 DB 并写缓存
            T data = loader.get();
            if (data == null) {
                safeSet(key, NULL_VALUE, NULL_TTL);               // 穿透：空值短过期
            } else {
                long ttl = baseTtl + ThreadLocalRandom.current().nextLong(baseTtl / 3 + 1);
                safeSet(key, data, ttl);                          // 雪崩：随机过期
            }
            return data;
        } finally {
            unlock(lockKey, lockValue);
        }
    }

    /** 删除缓存，写操作后调用保证缓存一致性 */
    public void evict(String key) {
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("Redis 删除缓存异常: key={}", key, e);
        }
    }

    /** 读原始 JSON，Redis 不可用时返回 null（触发降级直查 DB） */
    private String rawGet(String key) {
        try {
            return redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.warn("Redis 读取异常，降级直查 DB: key={}", key, e);
            return null;
        }
    }

    private <T> T parse(String json, Class<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (Exception e) {
            log.warn("缓存反序列化异常: {}", e.getMessage());
            return null;
        }
    }

    private void safeSet(String key, Object value, long ttlSeconds) {
        try {
            String json = value instanceof String ? (String) value : objectMapper.writeValueAsString(value);
            redisTemplate.opsForValue().set(key, json, Duration.ofSeconds(ttlSeconds));
        } catch (Exception e) {
            log.warn("Redis 写入异常: key={}", key, e);
        }
    }

    private boolean tryLock(String key, String value, long ttlSeconds) {
        try {
            Boolean ok = redisTemplate.opsForValue().setIfAbsent(key, value, Duration.ofSeconds(ttlSeconds));
            return Boolean.TRUE.equals(ok);
        } catch (Exception e) {
            log.warn("Redis 加锁异常: key={}", key, e);
            return false;
        }
    }

    private void unlock(String key, String value) {
        try {
            redisTemplate.execute(UNLOCK_SCRIPT, Collections.singletonList(key), value);
        } catch (Exception e) {
            log.warn("Redis 释放锁异常: key={}", key, e);
        }
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
