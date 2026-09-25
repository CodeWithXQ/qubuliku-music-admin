package com.musicsys.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("song")
public class Song {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private Long singerId;
    private String album;
    private String style;
    private Integer duration;
    private String isrc;
    private String coverUrl;
    private String audioUrl;
    private String lyric;
    private Long playCount;
    private Integer auditStatus;
    private Long auditorId;
    private LocalDateTime auditTime;
    private String auditRemark;
    private String audioFingerprint;
    private LocalDate releaseDate;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    // ===== 以下为 transient 字段：接收前端版权数据，不映射到 song 表 =====
    @TableField(exist = false)
    private String lyricAuthor;
    @TableField(exist = false)
    private String composer;
    @TableField(exist = false)
    private String copyrightCompany;
    @TableField(exist = false)
    private LocalDate licenseStart;
    @TableField(exist = false)
    private LocalDate licenseEnd;
}
