package com.internetbank.dto.response;

import com.internetbank.db.model.enums.LoanStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record LoanResponse(

        UUID id,
        BigDecimal amount,
        Integer termMonths,
        LoanStatus status,
        LocalDate createdAt,
        TariffResponse tariff
) {
}
