package com.internetbank.common.config;

import com.internetbank.common.idempotency.IdempotencyInterceptor;
import com.internetbank.common.idempotency.IdempotencyStore;
import com.internetbank.common.idempotency.RequestHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class IdempotencyWebConfig implements WebMvcConfigurer {

    private final IdempotencyStore idempotencyStore;
    private final RequestHasher requestHasher;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new IdempotencyInterceptor(
                idempotencyStore,
                requestHasher
        ));
    }
}