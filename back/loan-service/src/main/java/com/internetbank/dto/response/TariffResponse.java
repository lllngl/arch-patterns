package com.internetbank.dto.response;

import com.internetbank.common.enums.CurrencyCode;

import java.math.BigDecimal;
import java.util.UUID;

public record TariffResponse(

        UUID id,
        String name,
        BigDecimal rate,
        CurrencyCode currency,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        Integer minTermMonths,
        Integer maxTermMonths,
        boolean active

) {
}
