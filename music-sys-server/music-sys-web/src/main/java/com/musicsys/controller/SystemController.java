package com.musicsys.controller;

import com.musicsys.common.result.R;
import com.musicsys.mapper.SysUserMapper;
import com.musicsys.model.dto.PasswordForm;
import com.musicsys.model.entity.SysUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemController {

    private final SysUserMapper sysUserMapper;
    private final PasswordEncoder passwordEncoder;

    private Long getUserId(Principal principal) {
        SysUser user = sysUserMapper.findByUsername(principal.getName());
        if (user == null) throw new RuntimeException("用户不存在");
        return user.getId();
    }

    @GetMapping("/profile")
    public R<?> getProfile(Principal principal) {
        SysUser user = sysUserMapper.findByUsername(principal.getName());
        if (user != null) user.setPassword(null);
        return R.ok(user);
    }

    @PutMapping("/profile")
    public R<?> updateProfile(@RequestBody SysUser data, Principal principal) {
        data.setId(getUserId(principal));
        sysUserMapper.updateById(data);
        return R.ok();
    }

    @PutMapping("/password")
    public R<?> updatePassword(@RequestBody @Valid PasswordForm form, Principal principal) {
        SysUser user = sysUserMapper.findByUsername(principal.getName());
        if (!passwordEncoder.matches(form.getOldPassword(), user.getPassword())) {
            return R.fail(400, "原密码错误");
        }
        if (!form.getNewPassword().equals(form.getConfirmPassword())) {
            return R.fail(400, "两次新密码不一致");
        }
        user.setPassword(passwordEncoder.encode(form.getNewPassword()));
        sysUserMapper.updateById(user);
        return R.ok();
    }

    @GetMapping("/preferences")
    public R<?> getPreferences() {
        return R.ok(Map.of("defaultPage", "仪表盘", "pageSize", 50));
    }

    @PutMapping("/preferences")
    public R<?> updatePreferences(@RequestBody Map<String, Object> prefs) {
        return R.ok();
    }
}
