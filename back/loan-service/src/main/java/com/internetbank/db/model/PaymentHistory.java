package com.internetbank.db.model;

import com.internetbank.common.enums.CurrencyCode;
import com.internetbank.db.model.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "payment_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "loan_id", nullable = false)
    private UUID loanId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "payment_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal paymentAmount;

    @Column(name = "payment_currency", nullable = false)
    @Enumerated(EnumType.STRING)
    private CurrencyCode paymentCurrency;

    @Column(name = "loan_currency", nullable = false)
    @Enumerated(EnumType.STRING)
    private CurrencyCode loanCurrency;

    @Column(name = "exchange_rate_at_payment", precision = 19, scale = 6)
    private BigDecimal exchangeRateAtPayment;

    @Column(name = "expected_payment_date", nullable = false)
    private LocalDate expectedPaymentDate;

    @Column(name = "actual_payment_date")
    private LocalDate actualPaymentDate;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    @Column(name = "penalty_amount", precision = 19, scale = 2)
    private BigDecimal penaltyAmount;
}