package com.musicsys.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.musicsys.aop.OperationLog;
import com.musicsys.common.result.R;
import com.musicsys.common.util.CsvExportUtil;
import com.musicsys.mapper.SongMapper;
import com.musicsys.mapper.SysUserMapper;
import com.musicsys.model.dto.SongAuditDto;
import com.musicsys.model.dto.SongQuery;
import com.musicsys.model.entity.Song;
import com.musicsys.model.entity.SongCopyright;
import com.musicsys.service.SongCopyrightService;
import com.musicsys.service.SongService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/songs")
@RequiredArgsConstructor
public class SongController {

    private final SongService songService;
    private final SongCopyrightService copyrightService;
    private final SysUserMapper sysUserMapper;
    private final SongMapper songMapper;

    @GetMapping("/stats")
    public R<?> stats() {
        return R.ok(songMapper.selectStats());
    }

    @GetMapping
    public R<?> list(SongQuery query) {
        return R.ok(songService.list(query));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(songService.detail(id));
    }

    @PostMapping
    @OperationLog(value = "新增歌曲", module = "歌曲管理", opType = "ADD")
    public R<?> create(@RequestBody Song song) {
        Song created = songService.create(song);
        // 同步保存版权信息（前端随歌曲一同提交的版权字段）
        saveCopyrightIfPresent(created.getId(), song);
        return R.ok(created);
    }

    @PutMapping("/{id}")
    @OperationLog(value = "编辑歌曲", module = "歌曲管理", opType = "EDIT")
    public R<?> update(@PathVariable Long id, @RequestBody Song song) {
        songService.update(id, song);
        saveCopyrightIfPresent(id, song);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @OperationLog(value = "删除歌曲", module = "歌曲管理", opType = "DELETE")
    public R<?> delete(@PathVariable Long id) {
        songService.delete(id);
        return R.ok();
    }

    @PreAuthorize("hasAuthority('song:audit')")
    @PostMapping("/{id}/audit")
    @OperationLog(value = "审核歌曲", module = "歌曲管理", opType = "AUDIT")
    public R<?> audit(@PathVariable Long id, @RequestBody @Valid SongAuditDto dto, Principal principal) {
        Long auditorId = sysUserMapper.findByUsername(principal.getName()).getId();
        songService.audit(id, dto.getAction(), dto.getRemark(), auditorId);
        return R.ok();
    }

    @PreAuthorize("hasAuthority('song:audit')")
    @PostMapping("/batch-audit")
    @OperationLog(value = "批量审核歌曲", module = "歌曲管理", opType = "AUDIT")
    public R<?> batchAudit(@RequestBody @Valid SongAuditDto dto, Principal principal) {
        if (dto.getIds() == null || dto.getIds().isEmpty()) {
            return R.fail(400, "批量审核时ID列表不能为空");
        }
        Long auditorId = sysUserMapper.findByUsername(principal.getName()).getId();
        songService.batchAudit(dto.getIds(), dto.getAction(), dto.getRemark(), auditorId);
        return R.ok();
    }

    @PostMapping("/{id}/publish")
    @OperationLog(value = "上架歌曲", module = "歌曲管理", opType = "EDIT")
    public R<?> publish(@PathVariable Long id) {
        songService.publish(id);
        return R.ok();
    }

    @PostMapping("/{id}/unpublish")
    @OperationLog(value = "下架歌曲", module = "歌曲管理", opType = "EDIT")
    public R<?> unpublish(@PathVariable Long id) {
        songService.unpublish(id);
        return R.ok();
    }

    @PostMapping("/batch-publish")
    @OperationLog(value = "批量上架歌曲", module = "歌曲管理", opType = "EDIT")
    public R<?> batchPublish(@RequestBody Map<String, List<Long>> body) {
        songService.batchPublish(body.get("ids"));
        return R.ok();
    }

    @PostMapping("/batch-unpublish")
    @OperationLog(value = "批量下架歌曲", module = "歌曲管理", opType = "EDIT")
    public R<?> batchUnpublish(@RequestBody Map<String, List<Long>> body) {
        songService.batchUnpublish(body.get("ids"));
        return R.ok();
    }

    @PostMapping("/{id}/resubmit")
    @OperationLog(value = "重新提交审核", module = "歌曲管理", opType = "EDIT")
    public R<?> resubmit(@PathVariable Long id) {
        songService.resubmit(id);
        return R.ok();
    }

    /** 导出 CSV */
    @GetMapping("/export")
    @OperationLog(value = "导出歌曲列表", module = "歌曲管理", opType = "EXPORT")
    public ResponseEntity<byte[]> export(SongQuery query) {
        LambdaQueryWrapper<Song> w = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getKeyword())) w.like(Song::getTitle, query.getKeyword());
        if (StringUtils.hasText(query.getStyle())) w.eq(Song::getStyle, query.getStyle());
        if (StringUtils.hasText(query.getAuditStatus())) w.eq(Song::getAuditStatus, Integer.parseInt(query.getAuditStatus()));
        w.orderByDesc(Song::getUpdatedAt);
        List<Song> rows = songMapper.selectList(w);
        return CsvExportUtil.export("歌曲列表.csv",
            new String[]{"ID","歌曲名称","歌手ID","专辑","风格","时长(秒)","ISRC","播放量","审核状态","发行日期"},
            rows, s -> new Object[]{s.getId(), s.getTitle(), s.getSingerId(), s.getAlbum(),
                s.getStyle(), s.getDuration(), s.getIsrc(), s.getPlayCount(),
                s.getAuditStatus()==3?"已上架":s.getAuditStatus()==2?"已驳回":s.getAuditStatus()==1?"审核通过":s.getAuditStatus()==4?"已下架":"待审核",
                s.getReleaseDate()});
    }

    /** 上传封面图片 */
    @PostMapping("/upload/cover")
    public R<?> uploadCover(@RequestParam("file") MultipartFile file) {
        String url = songService.uploadCover(file);
        return R.ok(Map.of("url", url));
    }

    /** 上传音频文件 */
    @PostMapping("/upload/audio")
    public R<?> uploadAudio(@RequestParam("file") MultipartFile file) {
        String url = songService.uploadAudio(file);
        return R.ok(Map.of("url", url));
    }

    /** 从 Song 的 transient 字段提取版权信息并保存到 song_copyright 表 */
    private void saveCopyrightIfPresent(Long songId, Song song) {
        if (song.getLyricAuthor() == null && song.getComposer() == null
            && song.getCopyrightCompany() == null && song.getLicenseStart() == null) {
            return; // 没有版权数据，跳过
        }
        SongCopyright cp = new SongCopyright();
        cp.setSongId(songId);
        cp.setLyricAuthor(song.getLyricAuthor());
        cp.setComposer(song.getComposer());
        cp.setCopyrightCompany(song.getCopyrightCompany());
        cp.setLicenseStart(song.getLicenseStart());
        cp.setLicenseEnd(song.getLicenseEnd());
        copyrightService.saveOrUpdate(songId, cp);
    }
}
