package com.musicsys.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.musicsys.common.exception.BizException;
import com.musicsys.common.util.ImageUrlUtils;
import com.musicsys.mapper.AppUserMapper;
import com.musicsys.model.dto.UserQuery;
import com.musicsys.model.entity.AppUser;
import com.musicsys.model.vo.PageResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppUserService {

    private final AppUserMapper appUserMapper;
    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${app.upload.path:./uploads}")
    private String uploadPath;


    /** 上传用户头像 */
    public String uploadAvatar(MultipartFile file) {
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
            Path dir = Paths.get(uploadPath, "avatar");
            Files.createDirectories(dir);
            Path target = dir.resolve(fileName);
            file.transferTo(target);
            log.info("用户头像上传成功: {}", target.toAbsolutePath());
            return "/uploads/avatar/" + fileName;
        } catch (IOException e) {
            log.error("头像上传失败", e);
            throw new BizException(500, "头像上传失败: " + e.getMessage());
        }
    }

    public PageResult<AppUser> list(UserQuery query) {
        Page<AppUser> page = new Page<>(query.getPage(), query.getPageSize());
        LambdaQueryWrapper<AppUser> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.and(w -> w.like(AppUser::getNickname, query.getKeyword())
                   .or().like(AppUser::getPhone, query.getKeyword()));
        }
        if (StringUtils.hasText(query.getStatus())) {
            wrapper.eq(AppUser::getStatus, Integer.parseInt(query.getStatus()));
        }
        if (StringUtils.hasText(query.getUserType())) {
            wrapper.eq(AppUser::getUserType, Integer.parseInt(query.getUserType()));
        }
        wrapper.orderByDesc(AppUser::getLastLoginAt);
        Page<AppUser> result = appUserMapper.selectPage(page, wrapper);
        result.getRecords().forEach(u -> u.setAvatar(ImageUrlUtils.resolve(u.getAvatar())));
        return new PageResult<>(result.getRecords(), result.getTotal(), query.getPage(), query.getPageSize());
    }

    public AppUser detail(Long id) {
        AppUser user = appUserMapper.selectById(id);
        if (user == null) throw new BizException(404, "用户不存在");
        user.setAvatar(ImageUrlUtils.resolve(user.getAvatar()));
        return user;
    }

    @Transactional
    public AppUser create(AppUser user) {
        if (StringUtils.hasText(user.getPassword())) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        if (user.getStatus() == null) user.setStatus(2);
        if (user.getUserType() == null) user.setUserType(0);
        if (user.getFavoriteCount() == null) user.setFavoriteCount(0);
        if (user.getPlaylistCount() == null) user.setPlaylistCount(0);
        if (user.getRegisteredAt() == null) user.setRegisteredAt(LocalDateTime.now());
        appUserMapper.insert(user);
        return user;
    }

    @Transactional
    public AppUser update(Long id, AppUser data) {
        AppUser exist = appUserMapper.selectById(id);
        if (exist == null) throw new BizException(404, "用户不存在");
        if (!StringUtils.hasText(data.getPassword())) {
            data.setPassword(exist.getPassword());
        } else {
            data.setPassword(passwordEncoder.encode(data.getPassword()));
        }
        data.setId(id);
        appUserMapper.updateById(data);
        return appUserMapper.selectById(id);
    }

    public void updateStatus(Long id, Integer status) {
        AppUser user = appUserMapper.selectById(id);
        if (user == null) throw new BizException(404, "用户不存在");
        user.setStatus(status);
        appUserMapper.updateById(user);
    }

    public void delete(Long id) {
        if (appUserMapper.selectById(id) == null) throw new BizException(404, "用户不存在");
        appUserMapper.deleteById(id);
    }
}
