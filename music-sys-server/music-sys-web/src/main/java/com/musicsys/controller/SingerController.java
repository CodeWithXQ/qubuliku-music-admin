package com.musicsys.controller;

import com.musicsys.aop.OperationLog;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.musicsys.common.result.R;
import com.musicsys.common.util.CsvExportUtil;
import com.musicsys.mapper.SingerMapper;
import com.musicsys.model.dto.SingerQuery;
import com.musicsys.model.entity.Singer;
import com.musicsys.service.SingerService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/singers")
@RequiredArgsConstructor
public class SingerController {

    private final SingerService singerService;
    private final SingerMapper singerMapper;

    @GetMapping("/stats")
    public R<?> stats() {
        return R.ok(singerMapper.selectStats());
    }

    @GetMapping
    public R<?> list(SingerQuery query) {
        return R.ok(singerService.list(query));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(singerService.detail(id));
    }

    @PostMapping
    @OperationLog(value = "新增歌手", module = "歌手管理", opType = "ADD")
    public R<?> create(@RequestBody Singer singer) {
        return R.ok(singerService.create(singer));
    }

    @PutMapping("/{id}")
    @OperationLog(value = "编辑歌手", module = "歌手管理", opType = "EDIT")
    public R<?> update(@PathVariable Long id, @RequestBody Singer singer) {
        return R.ok(singerService.update(id, singer));
    }

    @DeleteMapping("/{id}")
    @OperationLog(value = "删除歌手", module = "歌手管理", opType = "DELETE")
    public R<?> delete(@PathVariable Long id) {
        singerService.delete(id);
        return R.ok();
    }

    /** 审核认证歌手（通过/驳回） */
    @PreAuthorize("hasAuthority('singer:audit')")
    @PostMapping("/{id}/certify")
    @OperationLog(value = "认证审核歌手", module = "歌手管理", opType = "AUDIT")
    public R<?> certify(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String action = (String) body.get("action");
        String remark = (String) body.getOrDefault("remark", "");
        singerService.certify(id, action, remark, null);
        return R.ok();
    }

    /** 重新提交认证（已驳回 → 待认证） */
    @PostMapping("/{id}/resubmit")
    @OperationLog(value = "重新提交认证", module = "歌手管理", opType = "EDIT")
    public R<?> resubmit(@PathVariable Long id) {
        singerService.resubmit(id);
        return R.ok();
    }

    /** 导出 CSV */
    @GetMapping("/export")
    @OperationLog(value = "导出歌手列表", module = "歌手管理", opType = "EXPORT")
    public ResponseEntity<byte[]> export(SingerQuery query) {
        LambdaQueryWrapper<Singer> w = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getKeyword())) w.like(Singer::getName, query.getKeyword());
        if (StringUtils.hasText(query.getStyle())) w.eq(Singer::getStyle, query.getStyle());
        if (StringUtils.hasText(query.getCertStatus())) w.eq(Singer::getCertStatus, Integer.parseInt(query.getCertStatus()));
        w.orderByDesc(Singer::getUpdatedAt);
        List<Singer> rows = singerMapper.selectList(w);
        return CsvExportUtil.export("歌手列表.csv",
            new String[]{"ID","歌手名称","风格","认证状态","作品数","粉丝数","简介","入驻时间"},
            rows, s -> new Object[]{s.getId(), s.getName(), s.getStyle(),
                s.getCertStatus()==2?"已认证":s.getCertStatus()==3?"已驳回":s.getCertStatus()==1?"待认证":"入驻中",
                s.getSongCount(), s.getFollowerCount(), s.getIntro(), s.getCreatedAt()});
    }

    /** 上传歌手头像 */
    @PostMapping("/upload/avatar")
    public R<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String url = singerService.uploadAvatar(file);
        return R.ok(Map.of("url", url));
    }
}
