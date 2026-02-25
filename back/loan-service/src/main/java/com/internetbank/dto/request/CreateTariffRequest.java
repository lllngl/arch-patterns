package com.internetbank.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CreateTariffRequest (

    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 50, message = "Name must be between 1 and 50 characters.")
    String name,

    @NotNull
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 17, fraction = 2, message = "Amount must have up to 17 digits before and 2 after the decimal point")
    BigDecimal minAmount,

    @NotNull
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 17, fraction = 2, message = "Amount must have up to 17 digits before and 2 after the decimal point")
    BigDecimal maxAmount,

    @Min(1)
    @NotNull(message = "Term in months cannot be null")
    Integer minTermMonths,

    @Min(1)
    @NotNull(message = "Term in months cannot be null")
    Integer maxTermMonths


) {}
