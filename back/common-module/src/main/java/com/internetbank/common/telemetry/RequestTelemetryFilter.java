package com.internetbank.common.telemetry;

import com.internetbank.common.config.TelemetryProperties;
import com.internetbank.common.dtos.monitoring.TelemetryEventRequest;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class RequestTelemetryFilter extends OncePerRequestFilter {

    private final MonitoringTelemetryClient monitoringTelemetryClient;
    private final TelemetryProperties telemetryProperties;

    @Value("${spring.application.name:unknown-service}")
    private String serviceName;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return MonitoringApiPaths.INTERNAL_TELEMETRY_PATH.equals(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (!telemetryProperties.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String traceId = resolveTraceId(request);
        request.setAttribute(TraceContext.REQUEST_ATTRIBUTE, traceId);
        response.setHeader(TraceContext.HEADER_NAME, traceId);
        MDC.put(TraceContext.MDC_KEY, traceId);

        long startedAt = System.nanoTime();
        Exception failure = null;
        try {
            filterChain.doFilter(request, response);
        } catch (Exception exception) {
            failure = exception;
            throw exception;
        } finally {
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
            int statusCode = failure == null ? response.getStatus() : HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
            boolean error = statusCode >= 400;
            String errorMessage = failure == null ? null : failure.getMessage();

            if (error) {
                log.warn(
                        "http_request traceId={} service={} method={} path={} status={} durationMs={} error={} message={}",
                        traceId,
                        serviceName,
                        request.getMethod(),
                        request.getRequestURI(),
                        statusCode,
                        durationMs,
                        true,
                        errorMessage
                );
            } else {
                log.info(
                        "http_request traceId={} service={} method={} path={} status={} durationMs={} error={}",
                        traceId,
                        serviceName,
                        request.getMethod(),
                        request.getRequestURI(),
                        statusCode,
                        durationMs,
                        false
                );
            }

            monitoringTelemetryClient.send(new TelemetryEventRequest(
                    traceId,
                    serviceName,
                    request.getMethod(),
                    request.getRequestURI(),
                    statusCode,
                    durationMs,
                    error,
                    errorMessage,
                    LocalDateTime.now()
            ));
            MDC.remove(TraceContext.MDC_KEY);
        }
    }

    private String resolveTraceId(HttpServletRequest request) {
        String traceId = request.getHeader(TraceContext.HEADER_NAME);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
        }
        return traceId;
    }
}
