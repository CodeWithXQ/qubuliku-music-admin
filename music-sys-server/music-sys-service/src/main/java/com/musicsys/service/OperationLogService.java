package com.musicsys.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.musicsys.mapper.OperationLogMapper;
import com.musicsys.model.dto.LogQuery;
import com.musicsys.model.entity.OperationLog;
import com.musicsys.model.vo.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class OperationLogService {

    private final OperationLogMapper operationLogMapper;

    public PageResult<OperationLog> list(LogQuery query) {
        Page<OperationLog> page = new Page<>(query.getPage(), query.getPageSize());
        LambdaQueryWrapper<OperationLog> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getOpType())) {
            wrapper.eq(OperationLog::getOpType, query.getOpType());
        }
        if (StringUtils.hasText(query.getModule())) {
            wrapper.eq(OperationLog::getModule, query.getModule());
        }
        if (StringUtils.hasText(query.getStartDate())) {
            wrapper.ge(OperationLog::getCreatedAt, query.getStartDate());
        }
        if (StringUtils.hasText(query.getEndDate())) {
            wrapper.le(OperationLog::getCreatedAt, query.getEndDate());
        }
        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.and(w -> w.like(OperationLog::getOperatorName, query.getKeyword())
                              .or().like(OperationLog::getDetail, query.getKeyword()));
        }
        wrapper.orderByDesc(OperationLog::getCreatedAt);
        Page<OperationLog> result = operationLogMapper.selectPage(page, wrapper);
        return new PageResult<>(result.getRecords(), result.getTotal(), query.getPage(), query.getPageSize());
    }

    public void delete(Long id) {
        operationLogMapper.deleteById(id);
    }

    @Transactional
    public int clear() {
        return operationLogMapper.delete(null);
    }
}
