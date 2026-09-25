package com.musicsys.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResultVo {
    private String token;
    private String tokenType = "Bearer";
    private Long expiresIn = 86400L;
}
