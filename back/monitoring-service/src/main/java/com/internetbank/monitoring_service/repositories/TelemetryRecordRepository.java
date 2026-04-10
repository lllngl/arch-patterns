package com.internetbank.monitoring_service.repositories;

import com.internetbank.monitoring_service.models.TelemetryRecord;
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

    Page<TelemetryRecord> findByErrorTrueOrderByOccurredAtDesc(Pageable pageable);

    Page<TelemetryRecord> findByServiceNameAndErrorTrueOrderByOccurredAtDesc(String serviceName, Pageable pageable);
}
