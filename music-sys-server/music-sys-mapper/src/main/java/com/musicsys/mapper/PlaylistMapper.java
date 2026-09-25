package com.musicsys.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.musicsys.model.entity.Playlist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.Map;

@Mapper
public interface PlaylistMapper extends BaseMapper<Playlist> {

    @Select("SELECT " +
            "COUNT(*) AS total, " +
            "COALESCE(SUM(CASE WHEN type = 1 THEN 1 ELSE 0 END), 0) AS userPlaylists, " +
            "COALESCE(SUM(favorite_count), 0) AS totalFavorites " +
            "FROM playlist")
    Map<String, Object> selectStats();
}
