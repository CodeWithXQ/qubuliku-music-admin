package com.musicsys.service;

import com.musicsys.mapper.DashboardMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DataAnalysisService {

    private final DashboardMapper dashboardMapper;

    /** 总览统计 */
    public Map<String, Object> overviewStats() {
        var overview = dashboardMapper.selectOverview();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalPlayCount", overview.getTotalPlays());
        stats.put("dailyActiveUser", overview.getDailyActiveUser());
        stats.put("newSongCount", overview.getActiveSongCount());
        stats.put("conversionRate", overview.getOfficialPlaylistCount() > 0 ?
            Math.round(overview.getOfficialPlaylistCount() * 100.0 / overview.getPlaylistCount()) : 0);
        return stats;
    }

    /** 播放趋势 */
    public List<Map<String, Object>> playTrends(Integer days) {
        String[] months = {"1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"};
        List<Map<String, Object>> list = new ArrayList<>();
        for (String m : months) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", m);
            item.put("流行", 120000 + (int)(Math.random() * 80000));
            item.put("摇滚", 60000 + (int)(Math.random() * 40000));
            item.put("民谣", 40000 + (int)(Math.random() * 30000));
            item.put("电子", 80000 + (int)(Math.random() * 50000));
            list.add(item);
        }
        return list;
    }

    /** 用户增长趋势 */
    public List<Map<String, Object>> userGrowth(Integer days) {
        String[] months = {"1月","2月","3月","4月","5月","6月"};
        List<Map<String, Object>> list = new ArrayList<>();
        for (String m : months) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", m);
            item.put("新增用户", 1500 + (int)(Math.random() * 2000));
            item.put("活跃用户", 25000 + (int)(Math.random() * 15000));
            list.add(item);
        }
        return list;
    }
}
