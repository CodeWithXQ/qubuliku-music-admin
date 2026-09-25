package com.musicsys.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.musicsys.model.dto.SongQuery;
import com.musicsys.model.entity.Song;
import com.musicsys.model.vo.SongVo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface SongMapper extends BaseMapper<Song> {

    IPage<SongVo> selectPageWithSinger(Page<?> page, @Param("query") SongQuery query);

    SongVo selectByIdWithSinger(@Param("id") Long id);

    /** 查询歌单内的歌曲列表 (含歌手名) */
    @Select("SELECT s.*, sg.name AS singerName " +
            "FROM playlist_song ps " +
            "JOIN song s ON ps.song_id = s.id " +
            "LEFT JOIN singer sg ON s.singer_id = sg.id " +
            "WHERE ps.playlist_id = #{playlistId} " +
            "ORDER BY ps.sort_order")
    List<SongVo> selectByPlaylistId(@Param("playlistId") Long playlistId);

    @Select("SELECT " +
            "COUNT(*) AS total, " +
            "COALESCE(SUM(CASE WHEN audit_status = 0 THEN 1 ELSE 0 END), 0) AS pending, " +
            "COALESCE(SUM(CASE WHEN audit_status = 3 AND MONTH(updated_at) = MONTH(NOW()) AND YEAR(updated_at) = YEAR(NOW()) THEN 1 ELSE 0 END), 0) AS publishedThisMonth, " +
            "COALESCE(SUM(play_count), 0) AS totalPlays " +
            "FROM song")
    Map<String, Object> selectStats();
}
