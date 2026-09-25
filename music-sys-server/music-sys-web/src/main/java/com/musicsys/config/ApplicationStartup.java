package com.musicsys.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Component
public class ApplicationStartup implements ApplicationRunner {

    @Value("${app.upload.path:./uploads}")
    private String uploadPath;

    @Override
    public void run(ApplicationArguments args) {
        for (String subDir : new String[]{"cover", "avatar", "audio", "generated/cover", "generated/avatar"}) {
            try {
                Path dir = Paths.get(uploadPath, subDir);
                Files.createDirectories(dir);
            } catch (Exception e) {
                log.warn("无法创建上传目录: {}", e.getMessage());
            }
        }
        log.info("上传目录已就绪: {}", Paths.get(uploadPath).toAbsolutePath());
    }
}
