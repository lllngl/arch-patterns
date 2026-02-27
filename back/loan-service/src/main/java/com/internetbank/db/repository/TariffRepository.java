package com.internetbank.db.repository;

import com.internetbank.db.model.Tariff;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TariffRepository extends JpaRepository<Tariff, UUID> {

    @Query("SELECT t FROM Tariff t WHERE t.isActive = :active")
    Page<Tariff> findByActive(@Param("active") Boolean active, Pageable pageable);
}
