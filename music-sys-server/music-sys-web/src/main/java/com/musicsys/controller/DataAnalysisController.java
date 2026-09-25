package com.musicsys.controller;

import com.musicsys.common.result.R;
import com.musicsys.mapper.DashboardMapper;
import com.musicsys.service.DataAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class DataAnalysisController {

    private final DataAnalysisService dataAnalysisService;
    private final DashboardMapper dashboardMapper;

    @GetMapping("/overview-stats")
    public R<?> overviewStats() {
        return R.ok(dataAnalysisService.overviewStats());
    }

    @GetMapping("/play-trends")
    public R<?> playTrends(@RequestParam(defaultValue = "7") Integer days) {
        return R.ok(dataAnalysisService.playTrends(days));
    }

    @GetMapping("/user-growth")
    public R<?> userGrowth(@RequestParam(defaultValue = "7") Integer days) {
        return R.ok(dataAnalysisService.userGrowth(days));
    }

    @GetMapping("/hot-songs")
    public R<?> hotSongs(@RequestParam(defaultValue = "10") Integer limit) {
        return R.ok(dashboardMapper.selectTopSongs(limit));
    }
}
