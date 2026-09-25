package com.musicsys.service;

import com.musicsys.mapper.SeckillActivityMapper;
import com.musicsys.model.entity.SeckillActivity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collections;

/**
 * 秒杀下单，防超卖双层保障：
 * <ul>
 *   <li>第一层：Redis Lua 原子预扣库存，快速拦截绝大多数请求（Redis 不可用时自动降级跳过）</li>
 *   <li>第二层：DB 乐观扣减 {@code WHERE stock > 0}，保证最终不会超卖</li>
 * </ul>
 * 另用 setnx 实现同一用户幂等（防重复下单）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SeckillService {

    private final StringRedisTemplate redisTemplate;
    private final SeckillActivityMapper seckillActivityMapper;

    private static final String STOCK_KEY_PREFIX = "seckill:stock:";
    private static final String ORDER_KEY_PREFIX = "seckill:order:";

    /** Lua 脚本：原子判断并扣减库存，返回扣减后剩余库存（-1 表示未初始化或已售罄） */
    private static final DefaultRedisScript<Long> DEDUCT_SCRIPT = new DefaultRedisScript<>(
            "local stock = redis.call('get', KEYS[1])\n" +
            "if not stock then return -1 end\n" +
            "if tonumber(stock) <= 0 then return -1 end\n" +
            "return redis.call('decr', KEYS[1])",
            Long.class);

    /**
     * @return "秒杀成功" / "重复下单" / "已售罄"
     */
    public String seckill(Long activityId, Long userId) {
        String stockKey = STOCK_KEY_PREFIX + activityId;
        String orderKey = ORDER_KEY_PREFIX + activityId + ":" + userId;

        // 0. 幂等：同一用户同一活动只允许成功一次
        try {
            Boolean first = redisTemplate.opsForValue().setIfAbsent(orderKey, "1", Duration.ofMinutes(10));
            if (!Boolean.TRUE.equals(first)) return "重复下单";
        } catch (Exception e) {
            log.warn("Redis 不可用，跳过幂等检查: {}", e.getMessage());
        }

        // 1. 第一层：Redis 原子预扣库存
        try {
            Long remain = redisTemplate.execute(DEDUCT_SCRIPT, Collections.singletonList(stockKey));
            if (remain != null && remain < 0) {
                redisTemplate.delete(orderKey);
                return "已售罄";
            }
        } catch (Exception e) {
            log.warn("Redis 预扣失败，降级直扣 DB: {}", e.getMessage());
        }

        // 2. 第二层：DB 乐观扣减兜底（防止 Redis 与 DB 状态不一致导致超卖）
        int rows = seckillActivityMapper.deductStock(activityId);
        if (rows == 0) {
            rollback(stockKey, orderKey);
            return "已售罄";
        }
        return "秒杀成功";
    }

    /** 初始化 / 重置活动库存到 Redis（活动开始前调用） */
    public void initStock(Long activityId, int stock) {
        redisTemplate.opsForValue().set(STOCK_KEY_PREFIX + activityId, String.valueOf(stock));
    }

    public SeckillActivity getActivity(Long id) {
        return seckillActivityMapper.selectById(id);
    }

    /** 售罄时回补 Redis 库存并清除幂等标记（Redis 不可用则静默跳过） */
    private void rollback(String stockKey, String orderKey) {
        try {
            redisTemplate.opsForValue().increment(stockKey);
            redisTemplate.delete(orderKey);
        } catch (Exception ignored) {
        }
    }
}
