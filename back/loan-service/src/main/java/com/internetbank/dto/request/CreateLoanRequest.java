package com.internetbank.dto.request;

import com.internetbank.db.model.enums.PaymentType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateLoanRequest (

        @NotNull(message = "User ID is required")
        UUID userId,

        @NotNull(message = "Account ID is required")
        UUID accountId,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be positive")
        @Digits(integer = 17, fraction = 2, message = "Invalid amount format")
        BigDecimal amount,

        @NotNull(message = "Term months is required")
        @Min(value = 1, message = "Term must be at least 1 month")
        @Max(value = 360, message = "Term cannot exceed 360 months")
        Integer termMonths,

        @NotNull(message = "Tariff ID is required")
        UUID tariffId,

        @NotNull(message = "Payment type is required")
        PaymentType paymentType

) {}