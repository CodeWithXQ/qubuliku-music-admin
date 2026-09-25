-- ============================================================
-- 曲不离库 · 秒杀模块 — 建表脚本
-- 用途：演示「Redis Lua 预扣库存 + DB 乐观扣减」双层防超卖
-- 数据库: MySQL 8.0+
-- ============================================================

USE music_sys;

-- 秒杀活动表
CREATE TABLE IF NOT EXISTS seckill_activity (
    id          BIGINT       PRIMARY KEY AUTO_INCREMENT COMMENT '活动ID',
    title       VARCHAR(100) NOT NULL                COMMENT '秒杀商品名',
    description VARCHAR(255) DEFAULT NULL            COMMENT '描述',
    total_stock INT          NOT NULL                COMMENT '总库存',
    stock       INT          NOT NULL                COMMENT '剩余库存',
    status      TINYINT      NOT NULL DEFAULT 0      COMMENT '0未开始 1进行中 2已结束',
    start_time  DATETIME     DEFAULT NULL            COMMENT '开始时间',
    end_time    DATETIME     DEFAULT NULL            COMMENT '结束时间',
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_seckill_status (status)
) ENGINE=InnoDB COMMENT='秒杀活动';

-- 初始化一条演示活动（库存 100）
INSERT INTO seckill_activity (title, description, total_stock, stock, status)
VALUES ('限量数字专辑《曲不离库·典藏版》', '秒杀防超卖演示：Redis Lua 预扣 + DB 乐观锁兜底', 100, 100, 1);
