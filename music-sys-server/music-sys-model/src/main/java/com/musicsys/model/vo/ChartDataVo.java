package com.musicsys.model.vo;

import lombok.Data;

@Data
public class ChartDataVo {
    private String label;
    private Long value;
    private Integer percent;
    private String color;
}
