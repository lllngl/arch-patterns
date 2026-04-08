package com.internetbank.common.dtos.monitoring;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record TelemetryEventRequest(
        @NotBlank String traceId,
        @NotBlank String serviceName,
        @NotBlank String method,
        @NotBlank String path,
        @NotNull Integer statusCode,
        @NotNull Long durationMs,
        @NotNull Boolean error,
        String errorMessage,
        @NotNull LocalDateTime occurredAt
) {
}
