package com.musicsys;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.musicsys.mapper")
@EnableScheduling
public class MusicSysApplication {
    public static void main(String[] args) {
        SpringApplication.run(MusicSysApplication.class, args);
    }
}
