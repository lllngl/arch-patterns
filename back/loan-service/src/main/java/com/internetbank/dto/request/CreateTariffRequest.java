package com.internetbank.dto.request;

import com.internetbank.common.enums.CurrencyCode;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CreateTariffRequest (

    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 50, message = "Name must be between 1 and 50 characters.")
    String name,

    @NotNull(message = "Rate cannot be null")
    @DecimalMin(value = "0.00", message = "Rate cannot be negative")
    @DecimalMax(value = "1.00", message = "Rate cannot be greater than 1.00")
    @Digits(integer = 1, fraction = 2, message = "Rate must have up to 1 digits before and 2 after the decimal point")
    BigDecimal rate,

    @NotNull(message = "Currency cannot be null")
    CurrencyCode currency,

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
