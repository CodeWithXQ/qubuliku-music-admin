package com.musicsys.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("singer")
public class Singer {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String avatar;
    private String style;
    private Integer certStatus;
    private String auditRemark;
    private String intro;
    private String socialLinks;
    private Integer songCount;
    private Integer followerCount;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
