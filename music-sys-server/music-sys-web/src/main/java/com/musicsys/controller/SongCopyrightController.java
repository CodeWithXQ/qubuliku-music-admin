package com.musicsys.controller;

import com.musicsys.aop.OperationLog;
import com.musicsys.common.result.R;
import com.musicsys.model.entity.SongCopyright;
import com.musicsys.service.SongCopyrightService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 版权管理 API：CRUD + 状态刷新 + 到期提醒查询
 */
@RestController
@RequestMapping("/api/songs")
@RequiredArgsConstructor
public class SongCopyrightController {

    private final SongCopyrightService copyrightService;

    /** 查某首歌的版权信息 */
    @GetMapping("/{songId}/copyright")
    public R<?> getCopyright(@PathVariable Long songId) {
        SongCopyright cp = copyrightService.getBySongId(songId);
        return R.ok(cp);
    }

    /** 保存或更新版权信息 */
    @PostMapping("/{songId}/copyright")
    @OperationLog(value = "保存版权信息", module = "版权管理", opType = "EDIT")
    public R<?> saveCopyright(@PathVariable Long songId, @RequestBody SongCopyright data) {
        return R.ok(copyrightService.saveOrUpdate(songId, data));
    }

    /** 删除版权信息 */
    @DeleteMapping("/{songId}/copyright")
    @OperationLog(value = "删除版权信息", module = "版权管理", opType = "DELETE")
    public R<?> deleteCopyright(@PathVariable Long songId) {
        copyrightService.deleteBySongId(songId);
        return R.ok();
    }

    /** 手动触发版权状态刷新 */
    @PostMapping("/copyright/refresh")
    @OperationLog(value = "刷新版权状态", module = "版权管理", opType = "EDIT")
    public R<?> refreshCopyrightStatus() {
        long[] result = copyrightService.manualRefresh();
        return R.ok(Map.of(
            "expiringSoon", result[0],
            "expired", result[1],
            "msg", "即将到期 " + result[0] + " 条, 已过期 " + result[1] + " 条"
        ));
    }

    /** 到期提醒列表（即将到期 + 已过期的版权） */
    @GetMapping("/copyright/alerts")
    public R<?> getCopyrightAlerts() {
        return R.ok(copyrightService.listExpiringOrExpired());
    }

    /** 全部版权列表 */
    @GetMapping("/copyright/list")
    public R<?> listAllCopyrights() {
        return R.ok(copyrightService.listAll());
    }
}
