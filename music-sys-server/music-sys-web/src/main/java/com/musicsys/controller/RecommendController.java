package com.musicsys.controller;

import com.musicsys.common.result.R;
import com.musicsys.service.RecommendService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/recommend")
@RequiredArgsConstructor
public class RecommendController {

    private final RecommendService recommendService;

    @GetMapping("/strategy")
    public R<?> getStrategy() {
        return R.ok(recommendService.getStrategy());
    }

    @PutMapping("/strategy")
    public R<?> updateStrategy(@RequestBody Map<String, Object> config) {
        recommendService.updateStrategy(config);
        return R.ok();
    }

    @GetMapping("/logs")
    public R<?> getLogs(@RequestParam(defaultValue = "1") Integer page,
                        @RequestParam(defaultValue = "10") Integer pageSize) {
        return R.ok(recommendService.getLogs(page, pageSize));
    }
}
