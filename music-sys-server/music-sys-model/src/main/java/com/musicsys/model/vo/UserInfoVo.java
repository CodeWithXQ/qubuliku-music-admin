package com.musicsys.model.vo;

import lombok.Data;
import java.util.List;

@Data
public class UserInfoVo {
    private Long id;
    private String username;
    private String avatar;
    private String realName;
    private String employeeId;
    private String position;
    private String department;
    private String phone;
    private List<String> roles;
    private List<String> permissions;
    private String lastLoginIp;
    private String lastLoginTime;
    private String createdAt;
}
