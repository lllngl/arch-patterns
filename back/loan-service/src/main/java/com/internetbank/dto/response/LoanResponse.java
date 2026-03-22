package com.internetbank.dto.response;

import com.internetbank.common.enums.CurrencyCode;
import com.internetbank.db.model.enums.LoanStatus;
import com.internetbank.db.model.enums.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record LoanResponse (

        UUID id,
        UUID userId,
        UUID accountId,
        BigDecimal amount,
        Integer termMonths,
        LoanStatus status,
        CurrencyCode currency,
        PaymentType paymentType,
        BigDecimal monthlyPayment,
        BigDecimal remainingAmount,
        LocalDate nextPaymentDate,
        LocalDate paymentDate,
        LocalDate createdAt,
        TariffResponse tariff

) {
}
