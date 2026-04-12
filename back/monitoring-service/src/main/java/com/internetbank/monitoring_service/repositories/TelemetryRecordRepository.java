package com.internetbank.monitoring_service.repositories;

import com.internetbank.monitoring_service.models.TelemetryRecord;
import com.internetbank.monitoring_service.models.TelemetrySource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface TelemetryRecordRepository extends JpaRepository<TelemetryRecord, UUID> {

    List<TelemetryRecord> findByOccurredAtBetweenOrderByOccurredAtAsc(LocalDateTime from, LocalDateTime to);

    List<TelemetryRecord> findByServiceNameAndOccurredAtBetweenOrderByOccurredAtAsc(String serviceName,
                                                                                    LocalDateTime from,
                                                                                    LocalDateTime to);

    List<TelemetryRecord> findBySourceAndOccurredAtBetweenOrderByOccurredAtAsc(TelemetrySource source,
                                                                               LocalDateTime from,
                                                                               LocalDateTime to);

    List<TelemetryRecord> findByServiceNameAndSourceAndOccurredAtBetweenOrderByOccurredAtAsc(String serviceName,
                                                                                              TelemetrySource source,
                                                                                              LocalDateTime from,
                                                                                              LocalDateTime to);

    Page<TelemetryRecord> findByErrorTrueOrderByOccurredAtDesc(Pageable pageable);

    Page<TelemetryRecord> findByServiceNameAndErrorTrueOrderByOccurredAtDesc(String serviceName, Pageable pageable);

    Page<TelemetryRecord> findBySourceAndErrorTrueOrderByOccurredAtDesc(TelemetrySource source, Pageable pageable);

    Page<TelemetryRecord> findByServiceNameAndSourceAndErrorTrueOrderByOccurredAtDesc(String serviceName,
                                                                                       TelemetrySource source,
                                                                                       Pageable pageable);
}
