package com.musicsys.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@TableName("song_play_stat")
public class SongPlayStat {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long songId;
    private LocalDate playDate;
    private Long playCount;
    private Integer uniqueListeners;
}
