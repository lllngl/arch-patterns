package com.internetbank.common.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AccountDTO(
        UUID id,
        UUID userId,
        String name,
        BigDecimal balance,
        String status,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
}

