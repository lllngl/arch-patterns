package com.internetbank.account_service.dtos;

import com.internetbank.common.enums.CurrencyCode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record TransferRequest(
        @NotNull(message = "Source account ID cannot be null")
        UUID fromAccountId,
        @NotNull(message = "Target account ID cannot be null")
        UUID toAccountId,
        @NotNull(message = "Amount cannot be null")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        @Digits(integer = 17, fraction = 2, message = "Amount must have up to 17 digits before and 2 after the decimal point")
        BigDecimal amount,
        CurrencyCode operationCurrency
) {
}
