package com.musicsys.controller;

import com.musicsys.common.result.R;
import com.musicsys.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public R<?> overview() {
        return R.ok(dashboardService.overview());
    }

    @GetMapping("/top-songs")
    public R<?> topSongs(@RequestParam(defaultValue = "10") Integer limit) {
        return R.ok(dashboardService.topSongs(limit));
    }

    @GetMapping("/style-distribution")
    public R<?> styleDistribution() {
        return R.ok(dashboardService.styleDistribution());
    }
}
