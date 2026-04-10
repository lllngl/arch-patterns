package com.internetbank.common.idempotency;

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
public class IdempotencyResultAspect {

    @Around("@within(org.springframework.web.bind.annotation.RestController)")
    public Object captureResult(ProceedingJoinPoint joinPoint) throws Throwable {

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes == null) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = attributes.getRequest();

        Object previousResult = request.getAttribute("idempotency.previousResult");
        if (previousResult != null) {
            log.info("Возвращаем кэшированный результат для повторного запроса");
            return previousResult;
        }

        Object result = joinPoint.proceed();
        request.setAttribute("idempotency.result", result);

        return result;
    }
}