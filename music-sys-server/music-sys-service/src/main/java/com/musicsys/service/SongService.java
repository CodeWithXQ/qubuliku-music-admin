package com.musicsys.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.musicsys.common.exception.BizException;
import com.musicsys.common.util.ImageUrlUtils;
import com.musicsys.mapper.SongMapper;
import com.musicsys.model.dto.SongQuery;
import com.musicsys.model.entity.Song;
import com.musicsys.model.vo.PageResult;
import com.musicsys.model.vo.SongVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

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
public class SongService {

    private final SongMapper songMapper;
    private final CacheService cacheService;

    private static final String SONG_CACHE_PREFIX = "cache:song:";
    private static final long SONG_CACHE_TTL = 1800L;

    @Value("${app.upload.path:./uploads}")
    private String uploadPath;

    /** 上传封面图 — 接受任意图片类型 */
    public String uploadCover(MultipartFile file) {
        return uploadFile(file, "cover");
    }

    /** 上传音频文件 — 接受任意音频类型 */
    public String uploadAudio(MultipartFile file) {
        return uploadFile(file, "audio");
    }

    private String uploadFile(MultipartFile file, String subDir) {
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
            Path dir = Paths.get(uploadPath, subDir);
            Files.createDirectories(dir);
            Path target = dir.resolve(fileName);
            file.transferTo(target);
            log.info("文件上传成功: {}", target.toAbsolutePath());
            return "/uploads/" + subDir + "/" + fileName;
        } catch (IOException e) {
            log.error("文件上传失败", e);
            throw new BizException(500, "文件上传失败: " + e.getMessage());
        }
    }

    public PageResult<SongVo> list(SongQuery query) {
        Page<SongVo> page = new Page<>(query.getPage(), query.getPageSize());
        var result = songMapper.selectPageWithSinger(page, query);
        result.getRecords().forEach(s -> s.setCoverUrl(ImageUrlUtils.resolve(s.getCoverUrl())));
        return new PageResult<>(result.getRecords(), result.getTotal(), query.getPage(), query.getPageSize());
    }

    public SongVo detail(Long id) {
        SongVo vo = cacheService.getWithCache(SONG_CACHE_PREFIX + id, SONG_CACHE_TTL,
                () -> {
                    SongVo v = songMapper.selectByIdWithSinger(id);
                    if (v != null) v.setCoverUrl(ImageUrlUtils.resolve(v.getCoverUrl()));
                    return v;
                }, SongVo.class);
        if (vo == null) throw new BizException(404, "歌曲不存在");
        return vo;
    }

    public Song create(Song song) {
        song.setPlayCount(0L);
        song.setAuditStatus(0);
        songMapper.insert(song);
        return song;
    }

    public void update(Long id, Song song) {
        Song exist = songMapper.selectById(id);
        if (exist == null) throw new BizException(404, "歌曲不存在");
        song.setId(id);
        songMapper.updateById(song);
        cacheService.evict(SONG_CACHE_PREFIX + id);
    }

    public void delete(Long id) {
        if (songMapper.selectById(id) == null) throw new BizException(404, "歌曲不存在");
        songMapper.deleteById(id);
        cacheService.evict(SONG_CACHE_PREFIX + id);
    }

    public void audit(Long id, String action, String remark, Long auditorId) {
        Song song = songMapper.selectById(id);
        if (song == null) throw new BizException(404, "歌曲不存在");
        if (!"pass".equals(action) && !"reject".equals(action)) {
            throw new BizException(400, "审核动作只能为 pass 或 reject");
        }
        song.setAuditStatus("pass".equals(action) ? 1 : 2);
        song.setAuditorId(auditorId);
        song.setAuditTime(LocalDateTime.now());
        song.setAuditRemark(remark);
        songMapper.updateById(song);
        cacheService.evict(SONG_CACHE_PREFIX + id);
    }

    @Transactional
    public void batchAudit(List<Long> ids, String action, String remark, Long auditorId) {
        for (Long id : ids) {
            audit(id, action, remark, auditorId);
        }
    }

    public void publish(Long id) {
        Song song = songMapper.selectById(id);
        if (song == null) throw new BizException(404, "歌曲不存在");
        if (song.getAuditStatus() != 1 && song.getAuditStatus() != 4) {
            throw new BizException(400, "只有审核通过或已下架的歌曲才能上架");
        }
        song.setAuditStatus(3);
        songMapper.updateById(song);
        cacheService.evict(SONG_CACHE_PREFIX + id);
    }

    public void unpublish(Long id) {
        Song song = songMapper.selectById(id);
        if (song == null) throw new BizException(404, "歌曲不存在");
        if (song.getAuditStatus() != 3) throw new BizException(400, "只有已上架的歌曲才能下架");
        song.setAuditStatus(4);
        songMapper.updateById(song);
        cacheService.evict(SONG_CACHE_PREFIX + id);
    }

    @Transactional
    public void batchPublish(List<Long> ids) {
        for (Long id : ids) publish(id);
    }

    @Transactional
    public void batchUnpublish(List<Long> ids) {
        for (Long id : ids) unpublish(id);
    }

    public void resubmit(Long id) {
        Song song = songMapper.selectById(id);
        if (song == null) throw new BizException(404, "歌曲不存在");
        if (song.getAuditStatus() != 2) throw new BizException(400, "只有已驳回的歌曲才能重新提交审核");
        song.setAuditStatus(0);
        songMapper.updateById(song);
        cacheService.evict(SONG_CACHE_PREFIX + id);
    }
}
