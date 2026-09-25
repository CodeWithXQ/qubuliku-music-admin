package com.musicsys.security;

import com.musicsys.mapper.SysPermissionMapper;
import com.musicsys.mapper.SysRoleMapper;
import com.musicsys.mapper.SysUserMapper;
import com.musicsys.model.entity.SysUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final SysUserMapper sysUserMapper;
    private final SysRoleMapper sysRoleMapper;
    private final SysPermissionMapper sysPermissionMapper;

    @Override
    public UserDetails loadUserByUsername(String usernameOrRealName) throws UsernameNotFoundException {
        SysUser user = sysUserMapper.findByUsernameOrRealName(usernameOrRealName);
        if (user == null || user.getStatus() == 0) {
            throw new UsernameNotFoundException("用户不存在或已禁用");
        }

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        var roles = sysRoleMapper.findByUserId(user.getId());
        for (var role : roles) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getRoleCode().toUpperCase()));
        }

        var perms = sysPermissionMapper.findByUserId(user.getId());
        authorities.addAll(perms.stream()
                .map(p -> new SimpleGrantedAuthority(p.getPermCode()))
                .collect(Collectors.toList()));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.getStatus() == 1,
                true, true, true,
                authorities
        );
    }
}
