package com.internetbank.monitoring_service.controllers;

import com.internetbank.common.dtos.monitoring.TelemetryEventRequest;
import com.internetbank.common.telemetry.MonitoringApiPaths;
import com.internetbank.monitoring_service.services.TelemetryRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MonitoringTelemetryIngestController {

    private final TelemetryRecordService telemetryRecordService;

    @PostMapping(MonitoringApiPaths.INTERNAL_TELEMETRY_PATH)
    @PreAuthorize("@internalSecurity.hasInternalAccess()")
    public ResponseEntity<Void> ingest(@RequestBody @Valid TelemetryEventRequest request) {
        telemetryRecordService.save(request);
        return ResponseEntity.accepted().build();
    }
}
