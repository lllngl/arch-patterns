package com.internetbank.common.clients;

import com.internetbank.common.exceptions.InternalServerErrorException;
import com.internetbank.common.exceptions.BadRequestException;
import com.internetbank.common.exceptions.ForbiddenException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.common.exceptions.UnauthorizedException;
import com.internetbank.common.telemetry.TraceContext;
import feign.Client;
import feign.RequestInterceptor;
import feign.Response;
import feign.httpclient.ApacheHttpClient;
import feign.codec.ErrorDecoder;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Configuration
@Slf4j
public class SecurityFeignClientConfig {

    @Value("${internal.api.key}")
    private String internalApiKey;

    @Bean
    public Client feignClient() {
        return new ApacheHttpClient();
    }

    @Bean
    public RequestInterceptor requestInterceptor() {
        return template -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                Object credentials = authentication.getCredentials();
                if (credentials instanceof String jwtToken && !jwtToken.isBlank()) {
                    template.header("Authorization", "Bearer " + jwtToken);
                }
            }
            String traceId = MDC.get(TraceContext.MDC_KEY);
            if (traceId != null && !traceId.isBlank()) {
                template.header(TraceContext.HEADER_NAME, traceId);
            }
            template.header("X-Internal-Request", internalApiKey);
        };
    }

    @Bean
    public ErrorDecoder feignErrorDecoder() {
        return new CustomFeignErrorDecoder();
    }

    public static class CustomFeignErrorDecoder implements ErrorDecoder {
        @Override
        public Exception decode(String methodKey, Response response) {
            String requestUrl = response.request().url();
            String errorMessage = String.format("Request to %s failed with status %d", requestUrl, response.status());

            return switch (response.status()) {
                case 400 -> new BadRequestException(errorMessage);
                case 401 -> new UnauthorizedException("Authentication failed: " + errorMessage);
                case 403 -> new ForbiddenException("Access denied: " + errorMessage);
                case 404 -> new NotFoundException("Resource not found: " + errorMessage);
                case 500 -> new InternalServerErrorException("Server error: " + errorMessage);
                default -> new ErrorDecoder.Default().decode(methodKey, response);
            };
        }
    }
}