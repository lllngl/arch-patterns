package com.internetbank.monitoring_service.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record FrontendTelemetryEventRequest(
        String traceId,
        @NotBlank String serviceName,
        @NotBlank String eventType,
        @NotBlank String path,
        @NotBlank String method,
        Integer statusCode,
        @NotNull Long durationMs,
        Integer retryCount,
        Boolean shortCircuited,
        @NotBlank String channel,
        @NotNull Boolean error,
        String errorMessage,
        @NotNull LocalDateTime occurredAt
) {
}
