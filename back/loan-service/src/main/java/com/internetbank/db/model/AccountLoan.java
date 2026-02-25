package com.internetbank.db.model;

import com.internetbank.db.model.enums.LoanStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "account_loan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountLoan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "account_id", nullable = false)
    @NotNull(message = "Account ID cannot be null")
    private UUID accountId;

    @Column(name = "loan_id", nullable = false)
    @NotNull(message = "Loan ID cannot be null")
    private UUID loanId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private LoanStatus status;

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

    @Column(name = "next_payment_date", nullable = false)
    private LocalDate nextPaymentDate;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "created_at", nullable = false)
    private LocalDate createdAt;
}
