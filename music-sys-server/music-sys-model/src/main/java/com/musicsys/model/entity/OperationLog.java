package com.musicsys.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("operation_log")
public class OperationLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long operatorId;
    private String operatorName;
    private String ipAddress;
    private String opType;
    private String module;
    private String detail;
    private Integer result;
    private String failReason;
    private String requestParams;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
