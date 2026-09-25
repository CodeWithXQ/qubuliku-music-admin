package com.musicsys.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@TableName("style_play_stat")
public class StylePlayStat {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String style;
    private LocalDate statDate;
    private Long playCount;
    private Integer songCount;
}
