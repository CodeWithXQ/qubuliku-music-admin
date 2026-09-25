package com.musicsys.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.musicsys.common.exception.BizException;
import com.musicsys.common.util.ImageUrlUtils;
import com.musicsys.mapper.SingerMapper;
import com.musicsys.mapper.SongMapper;
import com.musicsys.model.dto.SingerQuery;
import com.musicsys.model.entity.Singer;
import com.musicsys.model.entity.Song;
import com.musicsys.model.vo.PageResult;
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
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SingerService {

    private final SingerMapper singerMapper;
    private final SongMapper songMapper;

    @Value("${app.upload.path:./uploads}")
    private String uploadPath;


    public PageResult<Singer> list(SingerQuery query) {
        Page<Singer> page = new Page<>(query.getPage(), query.getPageSize());
        LambdaQueryWrapper<Singer> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.like(Singer::getName, query.getKeyword());
        }
        if (StringUtils.hasText(query.getStyle())) {
            wrapper.eq(Singer::getStyle, query.getStyle());
        }
        if (StringUtils.hasText(query.getCertStatus())) {
            wrapper.eq(Singer::getCertStatus, Integer.parseInt(query.getCertStatus()));
        }
        wrapper.orderByDesc(Singer::getUpdatedAt);
        Page<Singer> result = singerMapper.selectPage(page, wrapper);
        result.getRecords().forEach(s -> s.setAvatar(ImageUrlUtils.resolve(s.getAvatar())));
        return new PageResult<>(result.getRecords(), result.getTotal(), query.getPage(), query.getPageSize());
    }

    public Singer detail(Long id) {
        Singer singer = singerMapper.selectById(id);
        if (singer == null) throw new BizException(404, "歌手不存在");
        singer.setAvatar(ImageUrlUtils.resolve(singer.getAvatar()));
        return singer;
    }

    @Transactional
    public Singer create(Singer singer) {
        // 若未指定认证状态，默认待认证
        if (singer.getCertStatus() == null) {
            singer.setCertStatus(1);
        }
        singer.setSongCount(0);
        singer.setFollowerCount(0);
        singerMapper.insert(singer);

        // 将未关联歌手的歌曲（singerId IS NULL）归入此歌手
        LambdaUpdateWrapper<Song> songUpdate = new LambdaUpdateWrapper<>();
        songUpdate.isNull(Song::getSingerId).set(Song::getSingerId, singer.getId());
        songMapper.update(null, songUpdate);

        // 重新计算作品数
        Long count = songMapper.selectCount(
                new LambdaQueryWrapper<Song>().eq(Song::getSingerId, singer.getId()));
        singer.setSongCount(count.intValue());
        singerMapper.updateById(singer);
        singer.setAvatar(ImageUrlUtils.resolve(singer.getAvatar()));
        return singer;
    }

    /** 认证审核：通过(pass)则 certStatus→2，驳回(reject)则→3 并记录原因 */
    public void certify(Long id, String action, String remark, Long auditorId) {
        Singer singer = singerMapper.selectById(id);
        if (singer == null) throw new BizException(404, "歌手不存在");
        if (!"pass".equals(action) && !"reject".equals(action)) {
            throw new BizException(400, "认证动作只能为 pass 或 reject");
        }
        LambdaUpdateWrapper<Singer> uw = new LambdaUpdateWrapper<>();
        uw.eq(Singer::getId, id);
        if ("pass".equals(action)) {
            uw.set(Singer::getCertStatus, 2)
              .set(Singer::getAuditRemark, null);
        } else {
            uw.set(Singer::getCertStatus, 3)
              .set(Singer::getAuditRemark, remark);
        }
        singerMapper.update(null, uw);
    }

    /** 重新提交认证：已驳回 → 待认证 */
    public void resubmit(Long id) {
        Singer singer = singerMapper.selectById(id);
        if (singer == null) throw new BizException(404, "歌手不存在");
        if (singer.getCertStatus() != 3) throw new BizException(400, "只有已驳回的歌手才能重新提交认证");
        LambdaUpdateWrapper<Singer> uw = new LambdaUpdateWrapper<>();
        uw.eq(Singer::getId, id)
          .set(Singer::getCertStatus, 1)
          .set(Singer::getAuditRemark, null);  // 强制清空驳回原因
        singerMapper.update(null, uw);
    }

    public Singer update(Long id, Singer singer) {
        Singer exist = singerMapper.selectById(id);
        if (exist == null) throw new BizException(404, "歌手不存在");
        singer.setId(id);
        singerMapper.updateById(singer);
        Singer updated = singerMapper.selectById(id);
        updated.setAvatar(ImageUrlUtils.resolve(updated.getAvatar()));
        return updated;
    }

    public void delete(Long id) {
        if (singerMapper.selectById(id) == null) throw new BizException(404, "歌手不存在");
        singerMapper.deleteById(id);
    }

    /** 上传歌手头像 */
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
            log.info("头像上传成功: {}", target.toAbsolutePath());
            return "/uploads/avatar/" + fileName;
        } catch (IOException e) {
            log.error("头像上传失败", e);
            throw new BizException(500, "头像上传失败: " + e.getMessage());
        }
    }
}
