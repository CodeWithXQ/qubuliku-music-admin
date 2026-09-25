package com.musicsys.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.musicsys.model.entity.Singer;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.Map;

@Mapper
public interface SingerMapper extends BaseMapper<Singer> {

    @Select("SELECT " +
            "COUNT(*) AS total, " +
            "COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END), 0) AS newThisMonth, " +
            "COALESCE(SUM(song_count), 0) AS totalSongs, " +
            "COALESCE(SUM(follower_count), 0) AS totalFollowers " +
            "FROM singer")
    Map<String, Object> selectStats();
}
