package com.musicsys.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("曲不离库 · 音乐后台智能管理系统")
                        .version("1.0.0")
                        .description("REST API 接口文档")
                        .contact(new Contact().name("张明远").email("zhangmy@qubuliku.com")));
    }
}
