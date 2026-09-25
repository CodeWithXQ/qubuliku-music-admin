package com.musicsys.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("playlist")
public class Playlist {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String coverUrl;
    private String description;
    private Integer type;
    private String category;
    private Long creatorId;
    private String creatorName;
    private Integer status;
    private LocalDateTime publishTime;
    private Integer isPinned;
    private Integer songCount;
    private Integer favoriteCount;
    private Long playCount;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
