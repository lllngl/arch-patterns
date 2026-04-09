package com.internetbank.monitoring_service.dtos;

import java.time.LocalDateTime;

public record RecentTelemetryErrorResponse(
        String traceId,
        String serviceName,
        String method,
        String path,
        int statusCode,
        long durationMs,
        String errorMessage,
        LocalDateTime occurredAt
) {
}
