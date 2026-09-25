package com.musicsys.model.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SongQuery extends PageQuery {
    private String style;
    private String auditStatus;
}
