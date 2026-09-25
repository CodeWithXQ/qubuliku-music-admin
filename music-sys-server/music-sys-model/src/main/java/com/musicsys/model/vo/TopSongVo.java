package com.musicsys.model.vo;

import lombok.Data;

@Data
public class TopSongVo {
    private Long rank;
    private String title;
    private String singerName;
    private String style;
    private Long playCount;
}
