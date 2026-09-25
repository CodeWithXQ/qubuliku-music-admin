package com.musicsys.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 秒杀活动（限量数字专辑/周边）。库存通过 Redis 预扣 + DB 乐观扣减双层保证不超卖。
 */
@Data
@TableName("seckill_activity")
public class SeckillActivity {
    @TableId(type = IdType.AUTO)
    private Long id;
    /** 秒杀商品名 */
    private String title;
    private String description;
    /** 总库存 */
    private Integer totalStock;
    /** 剩余库存 */
    private Integer stock;
    /** 0未开始 1进行中 2已结束 */
    private Integer status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
