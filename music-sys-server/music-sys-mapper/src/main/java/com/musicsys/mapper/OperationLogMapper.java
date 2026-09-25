package com.musicsys.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.musicsys.model.entity.OperationLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.Map;

@Mapper
public interface OperationLogMapper extends BaseMapper<OperationLog> {

    @Select("SELECT " +
            "COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END), 0) AS todayCount, " +
            "COALESCE(SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END), 0) AS successCount, " +
            "COALESCE(SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END), 0) AS errorCount " +
            "FROM operation_log")
    Map<String, Object> selectStats();
}
