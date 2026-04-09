package com.internetbank.db.model;

import com.internetbank.common.enums.CurrencyCode;
import com.internetbank.db.model.enums.LoanStatus;
import com.internetbank.db.model.enums.PaymentType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "loan")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    @NotNull(message = "User ID cannot be null")
    private UUID userId;

    @Column(name = "account_id", nullable = false)
    @NotNull(message = "Account ID cannot be null")
    private UUID accountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "currency_code", nullable = false)
    private CurrencyCode currencyCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false)
    private PaymentType paymentType;

    @Column(name = "term_months", nullable = false)
    @Min(1)
    @NotNull(message = "Term in months cannot be null")
    private Integer termMonths;

    @Column(name = "tariff_id", nullable = false)
    @NotNull(message = "Tariff ID cannot be null")
    private UUID tariffId;

    @Column(nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.00", message = "Amount cannot be negative")
    @Digits(integer = 17, fraction = 2, message = "Amount must have up to 17 digits before and 2 after the decimal point")
    @NotNull(message = "Amount cannot be null")
    private BigDecimal amount;

    @Column(name = "monthly_payment", nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.00", message = "Payment cannot be negative")
    @Digits(integer = 17, fraction = 2, message = "Payment must have up to 17 digits before and 2 after the decimal point")
    @NotNull(message = "Payment cannot be null")
    private BigDecimal monthlyPayment;

    @Column(name = "remaining_amount", nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.00", message = "Amount cannot be negative")
    @Digits(integer = 17, fraction = 2, message = "Amount must have up to 17 digits before and 2 after the decimal point")
    @NotNull(message = "Amount cannot be null")
    private BigDecimal remainingAmount;

    @Column(name = "next_payment_date")
    private LocalDate nextPaymentDate;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "created_at", nullable = false)
    private LocalDate createdAt;
}
