package com.internetbank.common.dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.internetbank.common.enums.CurrencyCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AccountDTO(
        UUID id,
        UUID userId,
        String name,
        BigDecimal balance,
        CurrencyCode currency,
        String status,
        String type,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime createdAt,

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime modifiedAt
) {
}

