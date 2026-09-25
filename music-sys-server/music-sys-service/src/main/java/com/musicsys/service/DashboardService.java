package com.musicsys.service;

import com.musicsys.mapper.DashboardMapper;
import com.musicsys.model.vo.ChartDataVo;
import com.musicsys.model.vo.DashboardOverviewVo;
import com.musicsys.model.vo.TopSongVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DashboardMapper dashboardMapper;

    public DashboardOverviewVo overview() {
        return dashboardMapper.selectOverview();
    }

    public List<TopSongVo> topSongs(Integer limit) {
        return dashboardMapper.selectTopSongs(limit != null ? limit : 10);
    }

    public List<ChartDataVo> styleDistribution() {
        return dashboardMapper.selectStyleDistribution();
    }
}
