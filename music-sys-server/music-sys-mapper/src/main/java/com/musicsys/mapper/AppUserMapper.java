package com.musicsys.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.musicsys.model.entity.AppUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.Map;

@Mapper
public interface AppUserMapper extends BaseMapper<AppUser> {

    @Select("SELECT " +
            "COUNT(*) AS total, " +
            "COALESCE(SUM(CASE WHEN user_type = 1 THEN 1 ELSE 0 END), 0) AS vipCount, " +
            "COALESCE(SUM(CASE WHEN DATE(registered_at) = CURDATE() THEN 1 ELSE 0 END), 0) AS newToday, " +
            "0 AS retention7d " +
            "FROM app_user")
    Map<String, Object> selectStats();
}
