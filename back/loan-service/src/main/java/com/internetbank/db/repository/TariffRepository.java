package com.internetbank.db.repository;

import com.internetbank.db.model.Tariff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TariffRepository extends JpaRepository<Tariff, UUID> {
}
