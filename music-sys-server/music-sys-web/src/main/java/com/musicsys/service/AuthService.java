package com.musicsys.service;

import com.musicsys.common.exception.BizException;
import com.musicsys.mapper.SysPermissionMapper;
import com.musicsys.mapper.SysRoleMapper;
import com.musicsys.mapper.SysUserMapper;
import com.musicsys.model.dto.LoginDto;
import com.musicsys.model.entity.SysUser;
import com.musicsys.model.vo.LoginResultVo;
import com.musicsys.model.vo.UserInfoVo;
import com.musicsys.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SysUserMapper sysUserMapper;
    private final SysRoleMapper sysRoleMapper;
    private final SysPermissionMapper sysPermissionMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public LoginResultVo login(LoginDto dto, String ip) {
        SysUser user = sysUserMapper.findByUsernameOrRealName(dto.getUsername());
        if (user == null || !passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BizException(401, "用户名或密码错误");
        }
        if (user.getStatus() == 0) {
            throw new BizException(403, "账号已被禁用");
        }

        // 记录最后登录信息
        user.setLastLoginIp(ip);
        user.setLastLoginTime(LocalDateTime.now());
        sysUserMapper.updateById(user);

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRealName());
        return new LoginResultVo(token, "Bearer", 86400L);
    }

    public SysUser getCurrentUser(String principal) {
        SysUser user = sysUserMapper.findByUsername(principal);
        if (user == null) throw new BizException(404, "用户不存在");
        return user;
    }

    public UserInfoVo getUserInfo(Long userId) {
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new BizException(404, "用户不存在");
        }

        UserInfoVo vo = new UserInfoVo();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setAvatar(user.getAvatar());
        vo.setRealName(user.getRealName());
        vo.setEmployeeId(user.getEmployeeId());
        vo.setPosition(user.getPosition());
        vo.setDepartment(user.getDepartment());
        vo.setPhone(user.getPhone());
        vo.setLastLoginIp(user.getLastLoginIp());

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        if (user.getLastLoginTime() != null) {
            vo.setLastLoginTime(user.getLastLoginTime().format(fmt));
        }
        if (user.getCreatedAt() != null) {
            vo.setCreatedAt(user.getCreatedAt().format(fmt));
        }

        var roles = sysRoleMapper.findByUserId(user.getId());
        vo.setRoles(roles.stream().map(r -> r.getRoleCode()).collect(Collectors.toList()));

        var perms = sysPermissionMapper.findByUserId(user.getId());
        vo.setPermissions(perms.stream().map(p -> p.getPermCode()).collect(Collectors.toList()));

        return vo;
    }
}
