package com.musicsys.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.musicsys.model.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {

    @Select("SELECT * FROM sys_user WHERE username = #{username}")
    SysUser findByUsername(String username);

    @Select("SELECT * FROM sys_user WHERE username = #{keyword} OR real_name = #{keyword}")
    SysUser findByUsernameOrRealName(String keyword);
}
