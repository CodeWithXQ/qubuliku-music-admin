package com.musicsys.mapper;

import com.musicsys.model.vo.ChartDataVo;
import com.musicsys.model.vo.DashboardOverviewVo;
import com.musicsys.model.vo.TopSongVo;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface DashboardMapper {

    DashboardOverviewVo selectOverview();

    List<TopSongVo> selectTopSongs(Integer limit);

    List<ChartDataVo> selectStyleDistribution();
}
