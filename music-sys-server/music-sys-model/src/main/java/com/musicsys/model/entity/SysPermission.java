package com.musicsys.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("sys_permission")
public class SysPermission {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String permCode;
    private String permName;
    private Integer permType;
    private Long parentId;
    private String path;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
