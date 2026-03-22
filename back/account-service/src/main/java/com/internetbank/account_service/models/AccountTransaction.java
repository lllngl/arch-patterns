package com.internetbank.account_service.models;

import com.internetbank.account_service.enums.TransactionType;
import com.internetbank.common.audit.Auditable;
import com.internetbank.common.enums.CurrencyCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "account_transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountTransaction extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "account_id", nullable = false, updatable = false)
    @NotNull(message = "Account ID cannot be null")
    private UUID accountId;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2, updatable = false)
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 17, fraction = 2, message = "Amount must have up to 17 digits before and 2 after the decimal point")
    @NotNull(message = "Amount cannot be null")
    private BigDecimal amount;

    @Column(name = "operation_amount", nullable = false, precision = 19, scale = 2, updatable = false)
    @DecimalMin(value = "0.01", message = "Operation amount must be greater than 0")
    @Digits(integer = 17, fraction = 2, message = "Operation amount must have up to 17 digits before and 2 after the decimal point")
    @NotNull(message = "Operation amount cannot be null")
    private BigDecimal operationAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30, updatable = false)
    @NotNull(message = "Transaction type cannot be null")
    private TransactionType type;

    @Column(name = "description", length = 255)
    @Size(max = 255, message = "Description must be less than 255 characters")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "operation_currency", nullable = false, length = 3, updatable = false)
    @NotNull(message = "Operation currency cannot be null")
    private CurrencyCode operationCurrency;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_currency", nullable = false, length = 3, updatable = false)
    @NotNull(message = "Account currency cannot be null")
    private CurrencyCode accountCurrency;

    @Enumerated(EnumType.STRING)
    @Column(name = "bank_currency", nullable = false, length = 3, updatable = false)
    @NotNull(message = "Bank currency cannot be null")
    private CurrencyCode bankCurrency;

    @Column(name = "exchange_rate", precision = 19, scale = 8, updatable = false)
    private BigDecimal exchangeRate;

    @Column(name = "commission_amount", precision = 19, scale = 2, updatable = false)
    private BigDecimal commissionAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "commission_currency", length = 3, updatable = false)
    private CurrencyCode commissionCurrency;

    @Column(name = "related_account_id", updatable = false)
    private UUID relatedAccountId;
}



