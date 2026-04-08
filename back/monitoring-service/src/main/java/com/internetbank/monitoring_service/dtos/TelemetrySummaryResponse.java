package com.internetbank.monitoring_service.dtos;

import java.time.LocalDateTime;

public record TelemetrySummaryResponse(
        String serviceName,
        LocalDateTime from,
        LocalDateTime to,
        long totalRequests,
        long errorRequests,
        double errorRatePercent,
        double averageDurationMs,
        long maxDurationMs
) {
}
