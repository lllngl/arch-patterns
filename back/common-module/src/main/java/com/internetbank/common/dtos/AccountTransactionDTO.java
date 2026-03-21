package com.internetbank.common.dtos;

import com.internetbank.common.enums.CurrencyCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AccountTransactionDTO(
        UUID id,
        UUID accountId,
        BigDecimal amount,
        BigDecimal operationAmount,
        String type,
        String description,
        CurrencyCode operationCurrency,
        CurrencyCode accountCurrency,
        CurrencyCode bankCurrency,
        BigDecimal exchangeRate,
        BigDecimal commissionAmount,
        CurrencyCode commissionCurrency,
        UUID relatedAccountId,
        LocalDateTime createdAt
) {
}



