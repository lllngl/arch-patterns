package com.internetbank.dto.response;

import com.internetbank.db.model.enums.LoanStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record LoanResponse(

        UUID id,
        BigDecimal amount,
        Integer termMonths,
        LoanStatus status,
        TariffResponse tariff
) {
}
