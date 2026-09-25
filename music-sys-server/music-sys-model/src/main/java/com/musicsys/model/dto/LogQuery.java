package com.musicsys.model.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class LogQuery extends PageQuery {
    private String opType;
    private String module;
    private String startDate;
    private String endDate;
}
