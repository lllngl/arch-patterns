package com.internetbank.common.fault;

import com.internetbank.common.exceptions.InternalServerErrorException;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Aspect
@Component
public class FaultSimulator {

    @Around("@within(org.springframework.web.bind.annotation.RestController) || " +
            "@within(org.springframework.stereotype.Service)")
    public Object simulateFault(ProceedingJoinPoint joinPoint) throws Throwable {
        int errorRate = getCurrentErrorRate();
        int roll = ThreadLocalRandom.current().nextInt(100);

        if (roll < errorRate) {
            String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
            String methodName = joinPoint.getSignature().getName();

            log.warn("Симулируем ошибку 500 в {}.{} (error rate = {}%)",
                    className, methodName, errorRate);
            throw new InternalServerErrorException("Simulated unstable service response (500)");
        }

        return joinPoint.proceed();
    }

    private int getCurrentErrorRate() {
        return LocalDateTime.now().getMinute() % 2 == 0 ? 70 : 30;
    }
}