package com.internetbank.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record TariffResponse(

        UUID id,
        String name,
        BigDecimal rate,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        Integer minTermMonths,
        Integer maxTermMonths,
        boolean isActive

) {
}
