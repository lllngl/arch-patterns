package com.internetbank.monitoring_service.dtos;

import java.time.LocalDateTime;

public record TelemetryTimelinePointResponse(
        LocalDateTime bucketStart,
        long totalRequests,
        long errorRequests,
        double errorRatePercent,
        double averageDurationMs,
        long maxDurationMs
) {
}
