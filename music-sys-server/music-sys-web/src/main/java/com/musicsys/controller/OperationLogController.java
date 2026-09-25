package com.musicsys.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.musicsys.common.result.R;
import com.musicsys.common.util.CsvExportUtil;
import com.musicsys.mapper.OperationLogMapper;
import com.musicsys.model.dto.LogQuery;
import com.musicsys.service.OperationLogService;
import com.musicsys.model.entity.OperationLog;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class OperationLogController {

    private final OperationLogService operationLogService;
    private final OperationLogMapper operationLogMapper;

    @GetMapping("/operations")
    public R<?> list(LogQuery query) {
        return R.ok(operationLogService.list(query));
    }

    @GetMapping("/operations/stats")
    public R<?> stats() {
        return R.ok(operationLogMapper.selectStats());
    }

    @GetMapping("/operations/export")
    public ResponseEntity<byte[]> export(LogQuery query) {
        LambdaQueryWrapper<OperationLog> w = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(query.getKeyword())) w.like(OperationLog::getDetail, query.getKeyword());
        if (StringUtils.hasText(query.getOpType())) w.eq(OperationLog::getOpType, query.getOpType());
        if (StringUtils.hasText(query.getModule())) w.eq(OperationLog::getModule, query.getModule());
        w.orderByDesc(OperationLog::getCreatedAt);
        List<OperationLog> rows = operationLogMapper.selectList(w);
        return CsvExportUtil.export("操作日志.csv",
            new String[]{"ID","操作人","IP地址","操作类型","模块","详情","结果","时间"},
            rows, l -> new Object[]{l.getId(), l.getOperatorName(), l.getIpAddress(),
                l.getOpType(), l.getModule(), l.getDetail(),
                l.getResult()==1?"成功":"失败", l.getCreatedAt()});
    }

    @DeleteMapping("/operations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public R<?> delete(@PathVariable Long id) {
        operationLogService.delete(id);
        return R.ok();
    }

    @DeleteMapping("/operations")
    @PreAuthorize("hasRole('ADMIN')")
    public R<?> clear() {
        int count = operationLogService.clear();
        return R.ok("已清空 " + count + " 条日志");
    }
}
