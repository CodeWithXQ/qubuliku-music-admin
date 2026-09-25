package com.musicsys.model.dto;

import lombok.Data;

@Data
public class PageQuery {
    private Integer page = 1;
    private Integer pageSize = 10;
    private String keyword;
    private String sortField;
    private String sortOrder;
}
