package com.internetbank.common.telemetry;

import com.internetbank.common.config.TelemetryProperties;
import com.internetbank.common.dtos.monitoring.TelemetryEventRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@Slf4j
public class MonitoringTelemetryClient {

    private final RestClient restClient;
    private final TelemetryProperties telemetryProperties;
    private final String internalApiKey;

    public MonitoringTelemetryClient(RestClient.Builder restClientBuilder,
                                     TelemetryProperties telemetryProperties,
                                     @Value("${internal.api.key}") String internalApiKey) {
        this.restClient = restClientBuilder
                .baseUrl(telemetryProperties.getMonitoringBaseUrl())
                .build();
        this.telemetryProperties = telemetryProperties;
        this.internalApiKey = internalApiKey;
    }

    public void send(TelemetryEventRequest request) {
        if (!telemetryProperties.isEnabled() || !telemetryProperties.isExportEnabled()) {
            return;
        }

        try {
            restClient.post()
                    .uri(MonitoringApiPaths.INTERNAL_TELEMETRY_PATH)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Internal-Request", internalApiKey)
                    .header(TraceContext.HEADER_NAME, request.traceId())
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception exception) {
            log.warn(
                    "Failed to export telemetry to monitoring-service. traceId={}, service={}, path={}, message={}",
                    MDC.get(TraceContext.MDC_KEY),
                    request.serviceName(),
                    request.path(),
                    exception.getMessage()
            );
        }
    }
}
