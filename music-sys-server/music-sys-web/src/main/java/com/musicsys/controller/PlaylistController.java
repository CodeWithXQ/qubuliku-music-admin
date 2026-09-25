package com.musicsys.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.musicsys.aop.OperationLog;
import com.musicsys.common.result.R;
import com.musicsys.common.util.CsvExportUtil;
import com.musicsys.mapper.PlaylistMapper;
import com.musicsys.model.dto.PlaylistQuery;
import com.musicsys.model.dto.SongAuditDto;
import com.musicsys.model.entity.Playlist;
import com.musicsys.service.PlaylistService;
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
@RequestMapping("/api/playlists")
@RequiredArgsConstructor
public class PlaylistController {

    private final PlaylistService playlistService;
    private final PlaylistMapper playlistMapper;

    @GetMapping("/export")
    @OperationLog(value = "导出歌单列表", module = "歌单管理", opType = "EXPORT")
    public ResponseEntity<byte[]> export(PlaylistQuery query) {
        LambdaQueryWrapper<Playlist> w = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getKeyword())) w.like(Playlist::getName, query.getKeyword());
        if (StringUtils.hasText(query.getType())) w.eq(Playlist::getType, Integer.parseInt(query.getType()));
        if (StringUtils.hasText(query.getStatus())) w.eq(Playlist::getStatus, Integer.parseInt(query.getStatus()));
        w.orderByDesc(Playlist::getIsPinned).orderByDesc(Playlist::getUpdatedAt);
        List<Playlist> rows = playlistMapper.selectList(w);
        return CsvExportUtil.export("歌单列表.csv",
            new String[]{"ID","歌单名称","类型","状态","创建者","歌曲数","收藏数","播放量","发布时间"},
            rows, p -> new Object[]{p.getId(), p.getName(),
                p.getType()==1?"用户歌单":"官方歌单",
                p.getStatus()==2?"已发布":p.getStatus()==1?"审核通过":p.getStatus()==3?"已驳回":p.getStatus()==4?"已下架":"待审核",
                p.getCreatorName(), p.getSongCount(), p.getFavoriteCount(), p.getPlayCount(), p.getPublishTime()});
    }

    @GetMapping("/stats")
    public R<?> stats() {
        return R.ok(playlistMapper.selectStats());
    }

    @GetMapping
    public R<?> list(PlaylistQuery query) {
        return R.ok(playlistService.list(query));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(playlistService.detail(id));
    }

    @PostMapping
    @OperationLog(value = "新增歌单", module = "歌单管理", opType = "ADD")
    public R<?> create(@RequestBody Playlist playlist, Principal principal) {
        String creatorName = principal != null ? principal.getName() : "系统管理员";
        return R.ok(playlistService.create(playlist, creatorName));
    }

    /** 上传歌单封面 */
    @PostMapping("/upload/cover")
    public R<?> uploadCover(@RequestParam("file") MultipartFile file) {
        String url = playlistService.uploadCover(file);
        return R.ok(Map.of("url", url));
    }

    @PutMapping("/{id}")
    @OperationLog(value = "编辑歌单", module = "歌单管理", opType = "EDIT")
    public R<?> update(@PathVariable Long id, @RequestBody Playlist playlist) {
        playlistService.update(id, playlist);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @OperationLog(value = "删除歌单", module = "歌单管理", opType = "DELETE")
    public R<?> delete(@PathVariable Long id) {
        playlistService.delete(id);
        return R.ok();
    }

    @PreAuthorize("hasAuthority('playlist:audit')")
    @PostMapping("/{id}/audit")
    @OperationLog(value = "审核歌单", module = "歌单管理", opType = "AUDIT")
    public R<?> audit(@PathVariable Long id, @RequestBody Map<String, String> body) {
        playlistService.audit(id, body.get("action"), body.get("remark"));
        return R.ok();
    }

    @PreAuthorize("hasAuthority('playlist:audit')")
    @PostMapping("/batch-audit")
    @OperationLog(value = "批量审核歌单", module = "歌单管理", opType = "AUDIT")
    public R<?> batchAudit(@RequestBody @Valid SongAuditDto dto) {
        if (dto.getIds() == null || dto.getIds().isEmpty()) {
            return R.fail(400, "批量审核时ID列表不能为空");
        }
        playlistService.batchAudit(dto.getIds(), dto.getAction(), dto.getRemark());
        return R.ok();
    }

    @PostMapping("/{id}/publish")
    @OperationLog(value = "发布歌单", module = "歌单管理", opType = "EDIT")
    public R<?> publish(@PathVariable Long id) {
        playlistService.publish(id);
        return R.ok();
    }

    @PostMapping("/{id}/unpublish")
    @OperationLog(value = "下架歌单", module = "歌单管理", opType = "EDIT")
    public R<?> unpublish(@PathVariable Long id) {
        playlistService.unpublish(id);
        return R.ok();
    }

    @PostMapping("/batch-publish")
    @OperationLog(value = "批量上架歌单", module = "歌单管理", opType = "EDIT")
    public R<?> batchPublish(@RequestBody Map<String, List<Long>> body) {
        playlistService.batchPublish(body.get("ids"));
        return R.ok();
    }

    @PostMapping("/batch-unpublish")
    @OperationLog(value = "批量下架歌单", module = "歌单管理", opType = "EDIT")
    public R<?> batchUnpublish(@RequestBody Map<String, List<Long>> body) {
        playlistService.batchUnpublish(body.get("ids"));
        return R.ok();
    }

    @PostMapping("/{id}/resubmit")
    @OperationLog(value = "重新提交审核", module = "歌单管理", opType = "EDIT")
    public R<?> resubmit(@PathVariable Long id) {
        playlistService.resubmit(id);
        return R.ok();
    }

    @PutMapping("/{id}/pin")
    @OperationLog(value = "置顶/取消置顶", module = "歌单管理", opType = "EDIT")
    public R<?> togglePin(@PathVariable Long id) {
        playlistService.togglePin(id);
        return R.ok();
    }

    /** 获取歌单内的歌曲列表 */
    @GetMapping("/{id}/songs")
    public R<?> getSongs(@PathVariable Long id) {
        return R.ok(playlistService.getSongs(id));
    }

    @PostMapping("/{id}/songs")
    @OperationLog(value = "添加歌曲到歌单", module = "歌单管理", opType = "EDIT")
    public R<?> addSongs(@PathVariable Long id, @RequestBody Map<String, List<Long>> body) {
        playlistService.addSongs(id, body.get("songIds"));
        return R.ok();
    }

    @DeleteMapping("/{playlistId}/songs/{songId}")
    @OperationLog(value = "从歌单移除歌曲", module = "歌单管理", opType = "EDIT")
    public R<?> removeSong(@PathVariable Long playlistId, @PathVariable Long songId) {
        playlistService.removeSong(playlistId, songId);
        return R.ok();
    }
}
