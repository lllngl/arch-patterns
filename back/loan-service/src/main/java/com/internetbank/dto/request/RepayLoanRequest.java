package com.internetbank.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record RepayLoanRequest (

        @NotNull(message = "User ID is required")
        UUID userId,

        @NotNull(message = "Account ID is required")
        UUID accountId,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be positive")
        @Digits(integer = 17, fraction = 2, message = "Invalid amount format")
        BigDecimal amount

) { }
