package com.internetbank.monitoring_service.controllers;

import com.internetbank.monitoring_service.dtos.RecentTelemetryErrorResponse;
import com.internetbank.monitoring_service.dtos.TelemetrySummaryResponse;
import com.internetbank.monitoring_service.dtos.TelemetryTimelinePointResponse;
import com.internetbank.monitoring_service.models.TelemetrySource;
import com.internetbank.monitoring_service.services.TelemetryRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/monitoring")
@RequiredArgsConstructor
public class MonitoringQueryController {

    private final TelemetryRecordService telemetryRecordService;

    @GetMapping("/summary")
    public ResponseEntity<TelemetrySummaryResponse> getSummary(
            @RequestParam(name = "serviceName", required = false) String serviceName,
            @RequestParam(name = "source", required = false) TelemetrySource source,
            @RequestParam(name = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(name = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime resolvedTo = to == null ? LocalDateTime.now() : to;
        LocalDateTime resolvedFrom = from == null ? resolvedTo.minusHours(1) : from;
        return ResponseEntity.ok(telemetryRecordService.getSummary(serviceName, source, resolvedFrom, resolvedTo));
    }

    @GetMapping("/timeline")
    public ResponseEntity<List<TelemetryTimelinePointResponse>> getTimeline(
            @RequestParam(name = "serviceName", required = false) String serviceName,
            @RequestParam(name = "source", required = false) TelemetrySource source,
            @RequestParam(name = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(name = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(name = "bucketMinutes", defaultValue = "5") int bucketMinutes) {
        LocalDateTime resolvedTo = to == null ? LocalDateTime.now() : to;
        LocalDateTime resolvedFrom = from == null ? resolvedTo.minusHours(1) : from;
        return ResponseEntity.ok(telemetryRecordService.getTimeline(serviceName, source, resolvedFrom, resolvedTo, bucketMinutes));
    }

    @GetMapping("/errors/recent")
    public ResponseEntity<List<RecentTelemetryErrorResponse>> getRecentErrors(
            @RequestParam(name = "serviceName", required = false) String serviceName,
            @RequestParam(name = "source", required = false) TelemetrySource source,
            @RequestParam(name = "limit", defaultValue = "20") int limit) {
        return ResponseEntity.ok(telemetryRecordService.getRecentErrors(serviceName, source, limit));
    }
}
