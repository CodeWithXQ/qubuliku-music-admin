package com.musicsys.aop;

import com.musicsys.mapper.OperationLogMapper;
import com.musicsys.model.entity.OperationLog;
import com.musicsys.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class OperationLogAspect {

    private final OperationLogMapper operationLogMapper;
    private final JwtTokenProvider jwtTokenProvider;

    @Around("@annotation(opLog)")
    public Object around(ProceedingJoinPoint point, com.musicsys.aop.OperationLog opLog) throws Throwable {
        OperationLog logEntity = new OperationLog();
        logEntity.setOpType(opLog.opType());
        logEntity.setModule(opLog.module());
        logEntity.setDetail(opLog.value());

        HttpServletRequest request = ((ServletRequestAttributes)
                RequestContextHolder.getRequestAttributes()).getRequest();
        logEntity.setIpAddress(getClientIp(request));

        // 从 JWT 提取操作人（使用真实姓名）
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            try {
                String token = bearer.substring(7);
                logEntity.setOperatorId(jwtTokenProvider.getUserId(token));
                logEntity.setOperatorName(jwtTokenProvider.getRealName(token));
            } catch (Exception ignored) {}
        }

        try {
            Object result = point.proceed();
            logEntity.setResult(1);
            return result;
        } catch (Exception e) {
            logEntity.setResult(0);
            logEntity.setFailReason(e.getMessage());
            throw e;
        } finally {
            try {
                operationLogMapper.insert(logEntity);
            } catch (Exception e) {
                log.error("写入操作日志失败", e);
            }
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
