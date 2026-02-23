package com.internetbank.common.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AccountTransactionDTO(
        UUID id,
        UUID accountId,
        BigDecimal amount,
        String type,
        String description,
        LocalDateTime createdAt
) {
}



