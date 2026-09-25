package com.musicsys.controller;

import com.musicsys.common.result.R;
import com.musicsys.model.dto.LoginDto;
import com.musicsys.model.entity.SysUser;
import com.musicsys.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public R<?> login(@Valid @RequestBody LoginDto dto, HttpServletRequest request) {
        String ip = getClientIp(request);
        return R.ok(authService.login(dto, ip));
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

    @PostMapping("/logout")
    public R<?> logout() {
        return R.ok();
    }

    @GetMapping("/info")
    public R<?> getInfo(Principal principal) {
        SysUser user = authService.getCurrentUser(principal.getName());
        return R.ok(authService.getUserInfo(user.getId()));
    }
}
