package com.internetbank.db.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "loan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.00", message = "Amount cannot be negative")
    @Digits(integer = 17, fraction = 2, message = "Amount must have up to 17 digits before and 2 after the decimal point")
    @NotNull(message = "Amount cannot be null")
    private BigDecimal amount;

    @Column(name = "term_months", nullable = false)
    @Min(1)
    @NotNull(message = "Term in months cannot be null")
    private Integer termMonths;

    @Column(name = "tariff_id", nullable = false)
    @NotNull(message = "Tariff ID cannot be null")
    private UUID tariffId;
}
