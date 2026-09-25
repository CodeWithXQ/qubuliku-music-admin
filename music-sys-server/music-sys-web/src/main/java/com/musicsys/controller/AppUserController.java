package com.musicsys.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.musicsys.aop.OperationLog;
import com.musicsys.common.result.R;
import com.musicsys.common.util.CsvExportUtil;
import com.musicsys.mapper.AppUserMapper;
import com.musicsys.model.dto.StatusDto;
import com.musicsys.model.dto.UserQuery;
import com.musicsys.model.entity.AppUser;
import com.musicsys.service.AppUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class AppUserController {

    private final AppUserService appUserService;
    private final AppUserMapper appUserMapper;

    @GetMapping("/stats")
    public R<?> stats() {
        return R.ok(appUserMapper.selectStats());
    }

    @GetMapping
    public R<?> list(UserQuery query) {
        return R.ok(appUserService.list(query));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(appUserService.detail(id));
    }

    @PostMapping
    @OperationLog(value = "新增用户", module = "用户管理", opType = "ADD")
    public R<?> create(@RequestBody AppUser user) {
        return R.ok(appUserService.create(user));
    }

    @PutMapping("/{id}")
    @OperationLog(value = "编辑用户", module = "用户管理", opType = "EDIT")
    public R<?> update(@PathVariable Long id, @RequestBody AppUser user) {
        return R.ok(appUserService.update(id, user));
    }

    @PutMapping("/{id}/status")
    @OperationLog(value = "修改用户状态", module = "用户管理", opType = "EDIT")
    public R<?> updateStatus(@PathVariable Long id, @RequestBody @Valid StatusDto dto) {
        appUserService.updateStatus(id, dto.getStatus());
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @OperationLog(value = "删除用户", module = "用户管理", opType = "DELETE")
    public R<?> delete(@PathVariable Long id) {
        appUserService.delete(id);
        return R.ok();
    }

    /** 导出 CSV */
    @GetMapping("/export")
    @OperationLog(value = "导出用户列表", module = "用户管理", opType = "EXPORT")
    public ResponseEntity<byte[]> export(UserQuery query) {
        LambdaQueryWrapper<AppUser> w = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getKeyword())) {
            w.and(w2 -> w2.like(AppUser::getNickname, query.getKeyword())
                          .or().like(AppUser::getPhone, query.getKeyword()));
        }
        if (StringUtils.hasText(query.getStatus())) w.eq(AppUser::getStatus, Integer.parseInt(query.getStatus()));
        if (StringUtils.hasText(query.getUserType())) w.eq(AppUser::getUserType, Integer.parseInt(query.getUserType()));
        w.orderByDesc(AppUser::getLastLoginAt);
        List<AppUser> rows = appUserMapper.selectList(w);
        return CsvExportUtil.export("用户列表.csv",
            new String[]{"ID","昵称","手机号","用户类型","VIP到期","状态","收藏数","歌单数","注册时间","最后登录"},
            rows, u -> new Object[]{u.getId(), u.getNickname(), u.getPhone(),
                u.getUserType()==2?"音乐人":u.getUserType()==1?"VIP会员":"普通用户",
                u.getVipExpire(), u.getStatus()==0?"已禁用":u.getStatus()==2?"待激活":"正常",
                u.getFavoriteCount(), u.getPlaylistCount(), u.getRegisteredAt(), u.getLastLoginAt()});
    }

    /** 上传用户头像 */
    @PostMapping("/upload/avatar")
    public R<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String url = appUserService.uploadAvatar(file);
        return R.ok(Map.of("url", url));
    }
}
