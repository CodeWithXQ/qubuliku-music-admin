package com.musicsys.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.musicsys.common.exception.BizException;
import com.musicsys.common.util.ImageUrlUtils;
import com.musicsys.mapper.PlaylistMapper;
import com.musicsys.mapper.PlaylistSongMapper;
import com.musicsys.mapper.SongMapper;
import com.musicsys.model.dto.PlaylistQuery;
import com.musicsys.model.entity.Playlist;
import com.musicsys.model.entity.PlaylistSong;
import com.musicsys.model.vo.PageResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.musicsys.model.vo.SongVo;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlaylistService {

    private final PlaylistMapper playlistMapper;
    private final PlaylistSongMapper playlistSongMapper;
    private final SongMapper songMapper;

    @Value("${app.upload.path:./uploads}")
    private String uploadPath;


    public PageResult<Playlist> list(PlaylistQuery query) {
        Page<Playlist> page = new Page<>(query.getPage(), query.getPageSize());
        LambdaQueryWrapper<Playlist> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.like(Playlist::getName, query.getKeyword());
        }
        if (StringUtils.hasText(query.getType())) {
            wrapper.eq(Playlist::getType, Integer.parseInt(query.getType()));
        }
        if (StringUtils.hasText(query.getCategory())) {
            wrapper.eq(Playlist::getCategory, query.getCategory());
        }
        if (StringUtils.hasText(query.getStatus())) {
            wrapper.eq(Playlist::getStatus, Integer.parseInt(query.getStatus()));
        }
        wrapper.orderByDesc(Playlist::getIsPinned)
               .orderByDesc(Playlist::getUpdatedAt);
        Page<Playlist> result = playlistMapper.selectPage(page, wrapper);
        result.getRecords().forEach(p -> p.setCoverUrl(ImageUrlUtils.resolve(p.getCoverUrl())));
        return new PageResult<>(result.getRecords(), result.getTotal(), query.getPage(), query.getPageSize());
    }

    public Playlist detail(Long id) {
        Playlist playlist = playlistMapper.selectById(id);
        if (playlist == null) throw new BizException(404, "歌单不存在");
        playlist.setCoverUrl(ImageUrlUtils.resolve(playlist.getCoverUrl()));
        return playlist;
    }

    public Playlist create(Playlist playlist, String creatorName) {
        playlist.setCreatorName(creatorName);
        playlist.setType(0);                    // 后台统一为官方歌单
        playlist.setSongCount(0);
        playlist.setFavoriteCount(0);
        playlist.setPlayCount(0L);
        playlist.setIsPinned(0);
        playlist.setStatus(0);                  // 新建默认待审核
        playlistMapper.insert(playlist);
        return playlist;
    }

    /** 上传歌单封面 */
    public String uploadCover(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BizException(400, "上传文件不能为空");
        }
        String originalName = file.getOriginalFilename();
        String ext = "";
        if (originalName != null && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID().toString() + ext;
        try {
            Path dir = Paths.get(uploadPath, "cover");
            Files.createDirectories(dir);
            Path target = dir.resolve(fileName);
            file.transferTo(target);
            log.info("歌单封面上传成功: {}", target.toAbsolutePath());
            return "/uploads/cover/" + fileName;
        } catch (IOException e) {
            log.error("封面上传失败", e);
            throw new BizException(500, "封面上传失败: " + e.getMessage());
        }
    }

    public void update(Long id, Playlist data) {
        if (playlistMapper.selectById(id) == null) throw new BizException(404, "歌单不存在");
        data.setId(id);
        playlistMapper.updateById(data);
    }

    public void delete(Long id) {
        if (playlistMapper.selectById(id) == null) throw new BizException(404, "歌单不存在");
        playlistMapper.deleteById(id);
    }

    public void audit(Long id, String action, String remark) {
        Playlist playlist = playlistMapper.selectById(id);
        if (playlist == null) throw new BizException(404, "歌单不存在");
        if (!"pass".equals(action) && !"reject".equals(action)) {
            throw new BizException(400, "审核动作只能为 pass 或 reject");
        }
        // pass→审核通过(1), reject→已驳回(3)
        playlist.setStatus("pass".equals(action) ? 1 : 3);
        playlistMapper.updateById(playlist);
    }

    @Transactional
    public void batchAudit(java.util.List<Long> ids, String action, String remark) {
        for (Long id : ids) audit(id, action, remark);
    }

    public void publish(Long id) {
        Playlist playlist = playlistMapper.selectById(id);
        if (playlist == null) throw new BizException(404, "歌单不存在");
        // 只有审核通过(1)或已下架(4)的歌单可以发布
        if (playlist.getStatus() != 1 && playlist.getStatus() != 4) {
            throw new BizException(400, "只有审核通过或已下架的歌单才能发布");
        }
        playlist.setStatus(2);
        playlist.setPublishTime(LocalDateTime.now());
        playlistMapper.updateById(playlist);
    }

    public void unpublish(Long id) {
        Playlist playlist = playlistMapper.selectById(id);
        if (playlist == null) throw new BizException(404, "歌单不存在");
        // 只有已发布(2)的歌单可以下架
        if (playlist.getStatus() != 2) {
            throw new BizException(400, "只有已发布的歌单才能下架");
        }
        playlist.setStatus(4);
        playlistMapper.updateById(playlist);
    }

    @Transactional
    public void batchPublish(java.util.List<Long> ids) {
        for (Long id : ids) publish(id);
    }

    @Transactional
    public void batchUnpublish(java.util.List<Long> ids) {
        for (Long id : ids) unpublish(id);
    }

    public void resubmit(Long id) {
        Playlist playlist = playlistMapper.selectById(id);
        if (playlist == null) throw new BizException(404, "歌单不存在");
        if (playlist.getStatus() != 3) throw new BizException(400, "只有已驳回的歌单才能重新提交审核");
        playlist.setStatus(0);
        playlistMapper.updateById(playlist);
    }

    public void togglePin(Long id) {
        Playlist playlist = playlistMapper.selectById(id);
        if (playlist == null) throw new BizException(404, "歌单不存在");
        playlist.setIsPinned(playlist.getIsPinned() == 1 ? 0 : 1);
        playlistMapper.updateById(playlist);
    }

    /** 获取歌单内的歌曲列表 */
    public List<SongVo> getSongs(Long playlistId) {
        if (playlistMapper.selectById(playlistId) == null)
            throw new BizException(404, "歌单不存在");
        List<SongVo> songs = songMapper.selectByPlaylistId(playlistId);
        songs.forEach(s -> s.setCoverUrl(ImageUrlUtils.resolve(s.getCoverUrl())));
        return songs;
    }

    @Transactional
    public void addSongs(Long playlistId, java.util.List<Long> songIds) {
        Playlist playlist = playlistMapper.selectById(playlistId);
        if (playlist == null) throw new BizException(404, "歌单不存在");

        int added = 0;
        for (Long songId : songIds) {
            if (songMapper.selectById(songId) == null) continue;
            // 跳过已在歌单中的歌曲
            LambdaQueryWrapper<PlaylistSong> exists = new LambdaQueryWrapper<>();
            exists.eq(PlaylistSong::getPlaylistId, playlistId)
                  .eq(PlaylistSong::getSongId, songId);
            if (playlistSongMapper.selectCount(exists) > 0) continue;

            PlaylistSong ps = new PlaylistSong();
            ps.setPlaylistId(playlistId);
            ps.setSongId(songId);
            ps.setSortOrder(playlist.getSongCount() + added + 1);
            playlistSongMapper.insert(ps);
            added++;
        }
        if (added > 0) {
            playlist.setSongCount(playlist.getSongCount() + added);
            playlistMapper.updateById(playlist);
        }
    }

    @Transactional
    public void removeSong(Long playlistId, Long songId) {
        Playlist playlist = playlistMapper.selectById(playlistId);
        if (playlist == null) throw new BizException(404, "歌单不存在");

        LambdaQueryWrapper<PlaylistSong> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PlaylistSong::getPlaylistId, playlistId)
               .eq(PlaylistSong::getSongId, songId);
        int deleted = playlistSongMapper.delete(wrapper);

        if (deleted > 0 && playlist.getSongCount() > 0) {
            playlist.setSongCount(playlist.getSongCount() - 1);
            playlistMapper.updateById(playlist);
        }
    }
}
