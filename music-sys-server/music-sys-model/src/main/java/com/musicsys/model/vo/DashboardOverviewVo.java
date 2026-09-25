package com.musicsys.model.vo;

import lombok.Data;

@Data
public class DashboardOverviewVo {
    private Long songCount;
    private Long activeSongCount;
    private Long singerCount;
    private Long certifiedSingerCount;
    private Long playlistCount;
    private Long officialPlaylistCount;
    private Long userCount;
    private Long dailyActiveUser;
    private Long totalPlays;
    private Long totalListenHours;
    private Long playlistSaves;
    private Long commentCount;
    private Long shareCount;
    private Long newUserToday;
    private Integer songTrend;
    private Integer singerTrend;
    private Integer playlistTrend;
    private Integer userTrend;
}
