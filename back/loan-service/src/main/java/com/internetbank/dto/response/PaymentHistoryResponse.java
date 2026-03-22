package com.internetbank.dto.response;

import com.internetbank.common.enums.CurrencyCode;
import com.internetbank.db.model.enums.PaymentStatus;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Builder
public record PaymentHistoryResponse(
        UUID paymentId,
        UUID loanId,
        BigDecimal paymentAmount,
        CurrencyCode currencyCode,
        BigDecimal paymentAmountInLoanCurrency,
        CurrencyCode loanCurrencyCode,
        LocalDate expectedPaymentDate,
        LocalDate actualPaymentDate,
        PaymentStatus status,
        BigDecimal penaltyAmount
) {}