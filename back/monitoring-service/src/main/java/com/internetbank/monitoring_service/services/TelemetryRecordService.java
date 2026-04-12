package com.internetbank.monitoring_service.services;

import com.internetbank.common.dtos.monitoring.TelemetryEventRequest;
import com.internetbank.common.telemetry.TraceContext;
import com.internetbank.monitoring_service.dtos.FrontendTelemetryEventRequest;
import com.internetbank.monitoring_service.dtos.RecentTelemetryErrorResponse;
import com.internetbank.monitoring_service.dtos.TelemetrySummaryResponse;
import com.internetbank.monitoring_service.dtos.TelemetryTimelinePointResponse;
import com.internetbank.monitoring_service.models.TelemetryRecord;
import com.internetbank.monitoring_service.models.TelemetrySource;
import com.internetbank.monitoring_service.repositories.TelemetryRecordRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TelemetryRecordService {

    private final TelemetryRecordRepository telemetryRecordRepository;

    @Transactional
    public void save(TelemetryEventRequest request) {
        telemetryRecordRepository.save(TelemetryRecord.builder()
                .traceId(request.traceId())
                .serviceName(request.serviceName())
                .source(TelemetrySource.BACKEND)
                .eventType("HTTP_REQUEST")
                .method(request.method())
                .path(request.path())
                .statusCode(request.statusCode())
                .durationMs(request.durationMs())
                .retryCount(0)
                .shortCircuited(false)
                .channel("HTTP")
                .error(request.error())
                .errorMessage(request.errorMessage())
                .occurredAt(request.occurredAt())
                .build());
    }

    @Transactional
    public void saveFrontend(FrontendTelemetryEventRequest request) {
        String traceId = request.traceId();
        if (traceId == null || traceId.isBlank()) {
            traceId = MDC.get(TraceContext.MDC_KEY);
        }
        if (traceId == null || traceId.isBlank()) {
            traceId = java.util.UUID.randomUUID().toString();
        }

        telemetryRecordRepository.save(TelemetryRecord.builder()
                .traceId(traceId)
                .serviceName(request.serviceName())
                .source(TelemetrySource.FRONTEND)
                .eventType(request.eventType())
                .method(request.method())
                .path(request.path())
                .statusCode(request.statusCode() == null ? 0 : request.statusCode())
                .durationMs(request.durationMs())
                .retryCount(request.retryCount() == null ? 0 : request.retryCount())
                .shortCircuited(Boolean.TRUE.equals(request.shortCircuited()))
                .channel(request.channel())
                .error(request.error())
                .errorMessage(request.errorMessage())
                .occurredAt(request.occurredAt())
                .build());
    }

    @Transactional(readOnly = true)
    public TelemetrySummaryResponse getSummary(String serviceName, TelemetrySource source, LocalDateTime from, LocalDateTime to) {
        List<TelemetryRecord> records = loadRecords(serviceName, source, from, to);
        return buildSummary(serviceName, from, to, records);
    }

    @Transactional(readOnly = true)
    public List<TelemetryTimelinePointResponse> getTimeline(String serviceName,
                                                            TelemetrySource source,
                                                            LocalDateTime from,
                                                            LocalDateTime to,
                                                            int bucketMinutes) {
        int normalizedBucketMinutes = Math.max(bucketMinutes, 1);
        return loadRecords(serviceName, source, from, to).stream()
                .collect(Collectors.groupingBy(
                        record -> truncateToBucket(record.getOccurredAt(), normalizedBucketMinutes),
                        Collectors.toList()
                ))
                .entrySet()
                .stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> buildTimelinePoint(entry.getKey(), entry.getValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecentTelemetryErrorResponse> getRecentErrors(String serviceName, TelemetrySource source, int limit) {
        int normalizedLimit = Math.max(limit, 1);
        List<TelemetryRecord> records;
        if (serviceName == null || serviceName.isBlank()) {
            records = source == null
                    ? telemetryRecordRepository.findByErrorTrueOrderByOccurredAtDesc(PageRequest.of(0, normalizedLimit)).getContent()
                    : telemetryRecordRepository.findBySourceAndErrorTrueOrderByOccurredAtDesc(
                            source,
                            PageRequest.of(0, normalizedLimit)
                    ).getContent();
        } else {
            records = source == null
                    ? telemetryRecordRepository.findByServiceNameAndErrorTrueOrderByOccurredAtDesc(
                            serviceName,
                            PageRequest.of(0, normalizedLimit)
                    ).getContent()
                    : telemetryRecordRepository.findByServiceNameAndSourceAndErrorTrueOrderByOccurredAtDesc(
                            serviceName,
                            source,
                            PageRequest.of(0, normalizedLimit)
                    ).getContent();
        }

        return records.stream()
                .map(record -> new RecentTelemetryErrorResponse(
                        record.getTraceId(),
                        record.getServiceName(),
                        record.getMethod(),
                        record.getPath(),
                        record.getStatusCode(),
                        record.getDurationMs(),
                        record.getErrorMessage(),
                        record.getOccurredAt()
                ))
                .toList();
    }

    private List<TelemetryRecord> loadRecords(String serviceName, TelemetrySource source, LocalDateTime from, LocalDateTime to) {
        if (serviceName == null || serviceName.isBlank()) {
            return source == null
                    ? telemetryRecordRepository.findByOccurredAtBetweenOrderByOccurredAtAsc(from, to)
                    : telemetryRecordRepository.findBySourceAndOccurredAtBetweenOrderByOccurredAtAsc(source, from, to);
        }
        return source == null
                ? telemetryRecordRepository.findByServiceNameAndOccurredAtBetweenOrderByOccurredAtAsc(serviceName, from, to)
                : telemetryRecordRepository.findByServiceNameAndSourceAndOccurredAtBetweenOrderByOccurredAtAsc(
                        serviceName,
                        source,
                        from,
                        to
                );
    }

    private TelemetrySummaryResponse buildSummary(String serviceName,
                                                  LocalDateTime from,
                                                  LocalDateTime to,
                                                  List<TelemetryRecord> records) {
        long totalRequests = records.size();
        long errorRequests = records.stream().filter(TelemetryRecord::getError).count();
        double averageDurationMs = records.stream()
                .mapToLong(TelemetryRecord::getDurationMs)
                .average()
                .orElse(0.0);
        long maxDurationMs = records.stream()
                .map(TelemetryRecord::getDurationMs)
                .max(Comparator.naturalOrder())
                .orElse(0L);

        return new TelemetrySummaryResponse(
                emptyToNull(serviceName),
                from,
                to,
                totalRequests,
                errorRequests,
                toPercent(errorRequests, totalRequests),
                round(averageDurationMs),
                maxDurationMs
        );
    }

    private TelemetryTimelinePointResponse buildTimelinePoint(LocalDateTime bucketStart, List<TelemetryRecord> records) {
        TelemetrySummaryResponse summary = buildSummary(null, bucketStart, bucketStart, records);
        return new TelemetryTimelinePointResponse(
                bucketStart,
                summary.totalRequests(),
                summary.errorRequests(),
                summary.errorRatePercent(),
                summary.averageDurationMs(),
                summary.maxDurationMs()
        );
    }

    private LocalDateTime truncateToBucket(LocalDateTime dateTime, int bucketMinutes) {
        int minuteBucket = (dateTime.getMinute() / bucketMinutes) * bucketMinutes;
        return dateTime.withSecond(0).withNano(0).withMinute(minuteBucket);
    }

    private double toPercent(long errors, long total) {
        if (total == 0) {
            return 0.0;
        }
        return round((errors * 100.0) / total);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
