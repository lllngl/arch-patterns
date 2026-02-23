package com.internetbank.account_service.models;

import com.internetbank.account_service.enums.TransactionType;
import com.internetbank.common.audit.Auditable;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "account_transactions")
@Getter
@Setter
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

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30, updatable = false)
    @NotNull(message = "Transaction type cannot be null")
    private TransactionType type;

    @Column(name = "description", length = 255)
    @Size(max = 255, message = "Description must be less than 255 characters")
    private String description;
}



