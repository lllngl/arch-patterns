package com.internetbank.db.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tariff")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tariff {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 50)
    @NotBlank(message = "Tariff name cannot be blank")
    @Size(max = 50, message = "Tariff name must be less than 50 characters")
    private String name;

    @Column(nullable = false, precision = 3, scale = 2)
    @DecimalMin(value = "0.00", message = "Rate cannot be negative")
    @DecimalMax(value = "1.00", message = "Rate cannot be greater than 1.00")
    @Digits(integer = 1, fraction = 2, message = "Rate must have up to 1 digits before and 2 after the decimal point")
    @NotNull(message = "Rate cannot be null")
    private BigDecimal rate;

    @Column(name = "min_amount", nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 17, fraction = 2, message = "Amount must have up to 17 digits before and 2 after the decimal point")
    @NotNull(message = "Amount cannot be null")
    private BigDecimal minAmount;

    @Column(name = "max_amount", nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 17, fraction = 2, message = "Amount must have up to 17 digits before and 2 after the decimal point")
    @NotNull(message = "Amount cannot be null")
    private BigDecimal maxAmount;

    @Column(name = "min_term_months", nullable = false)
    @Min(1)
    @NotNull(message = "Term in months cannot be null")
    private Integer minTermMonths;

    @Column(name = "max_term_months", nullable = false)
    @Min(1)
    @NotNull(message = "Term in months cannot be null")
    private Integer maxTermMonths;

    @Column(name = "is_active")
    private boolean isActive;
}
