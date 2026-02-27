package com.internetbank.dto.request;

import com.internetbank.common.enums.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record TransactionRequest (

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be positive")
        BigDecimal amount,

        @NotNull(message = "Transaction type is required")
        TransactionType type,

        @Size(max = 255, message = "Description must be less than 255 characters")
        String description
) { }
