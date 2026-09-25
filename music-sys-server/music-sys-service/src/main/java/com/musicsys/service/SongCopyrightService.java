package com.musicsys.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.musicsys.common.exception.BizException;
import com.musicsys.mapper.SongCopyrightMapper;
import com.musicsys.mapper.SongMapper;
import com.musicsys.model.entity.SongCopyright;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 版权全生命周期管理：
 *   待录入(0) → 已授权(1) → 即将到期(2, 距 license_end ≤ 30 天) → 已过期(3, license_end 已过)
 * 每日凌晨自动扫描到期版权并更新状态。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SongCopyrightService {

    private final SongCopyrightMapper copyrightMapper;
    private final SongMapper songMapper;

    /** 即将到期的提前天数阈值 */
    private static final int EXPIRE_SOON_DAYS = 30;

    // ==================== CRUD ====================

    public SongCopyright getBySongId(Long songId) {
        if (songMapper.selectById(songId) == null) throw new BizException(404, "歌曲不存在");
        return copyrightMapper.selectOne(
            new LambdaQueryWrapper<SongCopyright>().eq(SongCopyright::getSongId, songId));
    }

    @Transactional
    public SongCopyright saveOrUpdate(Long songId, SongCopyright data) {
        if (songMapper.selectById(songId) == null) throw new BizException(404, "歌曲不存在");
        SongCopyright exist = copyrightMapper.selectOne(
            new LambdaQueryWrapper<SongCopyright>().eq(SongCopyright::getSongId, songId));
        if (exist != null) {
            data.setId(exist.getId());
            data.setSongId(songId);
            data.setStatus(computeStatus(data));
            copyrightMapper.updateById(data);
            return copyrightMapper.selectById(exist.getId());
        }
        data.setSongId(songId);
        if (data.getStatus() == null || data.getStatus() == 0) {
            data.setStatus(computeStatus(data));
        }
        copyrightMapper.insert(data);
        return data;
    }

    @Transactional
    public void deleteBySongId(Long songId) {
        LambdaQueryWrapper<SongCopyright> w = new LambdaQueryWrapper<>();
        w.eq(SongCopyright::getSongId, songId);
        copyrightMapper.delete(w);
    }

    // ==================== 状态流转 ====================

    /** 根据当前日期和 licenseEnd 计算应有的版权状态 */
    private Integer computeStatus(SongCopyright cp) {
        if (cp.getLicenseEnd() == null) return 0; // 待录入
        LocalDate today = LocalDate.now();
        if (today.isAfter(cp.getLicenseEnd())) return 3;                // 已过期
        if (!today.plusDays(EXPIRE_SOON_DAYS).isBefore(cp.getLicenseEnd())) return 2; // 30天内 → 即将到期
        return 1; // 已授权
    }

    /**
     * 每日凌晨 2 点自动扫描，将已授权→即将到期、即将到期→已过期的版权更新状态。
     * 仅在项目启用定时任务时生效（需 @EnableScheduling）。
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void refreshExpiredStatus() {
        LocalDate today = LocalDate.now();
        LocalDate soon = today.plusDays(EXPIRE_SOON_DAYS);

        // 1. 已授权 → 即将到期：licenseEnd 在 [today, today+30] 范围内
        LambdaQueryWrapper<SongCopyright> toSoon = new LambdaQueryWrapper<>();
        toSoon.eq(SongCopyright::getStatus, 1)
              .le(SongCopyright::getLicenseEnd, soon)
              .ge(SongCopyright::getLicenseEnd, today);
        List<SongCopyright> soonList = copyrightMapper.selectList(toSoon);
        for (SongCopyright cp : soonList) {
            cp.setStatus(2);
            copyrightMapper.updateById(cp);
        }

        // 2. 即将到期 → 已过期：licenseEnd 已过
        LambdaQueryWrapper<SongCopyright> toExpired = new LambdaQueryWrapper<>();
        toExpired.in(SongCopyright::getStatus, 1, 2)
                .lt(SongCopyright::getLicenseEnd, today);
        List<SongCopyright> expiredList = copyrightMapper.selectList(toExpired);
        for (SongCopyright cp : expiredList) {
            cp.setStatus(3);
            copyrightMapper.updateById(cp);
        }

        if (!soonList.isEmpty() || !expiredList.isEmpty()) {
            log.info("版权状态自动更新: 即将到期 {} 条, 已过期 {} 条", soonList.size(), expiredList.size());
        }
    }

    /** 手动触发刷新（供管理员在后台手动执行） */
    @Transactional
    public long[] manualRefresh() {
        refreshExpiredStatus();
        return new long[]{ countByStatus(2), countByStatus(3) };
    }

    // ==================== 统计查询 ====================

    public long countByStatus(int status) {
        return copyrightMapper.selectCount(
            new LambdaQueryWrapper<SongCopyright>().eq(SongCopyright::getStatus, status));
    }

    /** 即将到期或已过期的版权列表（用于运营提醒） */
    public List<SongCopyright> listExpiringOrExpired() {
        LambdaQueryWrapper<SongCopyright> w = new LambdaQueryWrapper<>();
        w.in(SongCopyright::getStatus, 2, 3).orderByAsc(SongCopyright::getLicenseEnd);
        return copyrightMapper.selectList(w);
    }

    public List<SongCopyright> listAll() {
        return copyrightMapper.selectList(
            new LambdaQueryWrapper<SongCopyright>().orderByAsc(SongCopyright::getLicenseEnd));
    }
}
