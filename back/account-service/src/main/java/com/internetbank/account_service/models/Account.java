package com.internetbank.account_service.models;

import com.internetbank.account_service.enums.AccountStatus;
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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Account extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    @NotNull(message = "User ID cannot be null")
    private UUID userId;

    @Column(name = "name", nullable = false, length = 100)
    @NotBlank(message = "Account name cannot be blank")
    @Size(max = 100, message = "Account name must be less than 100 characters")
    private String name;

    @Column(name = "balance", nullable = false, precision = 19, scale = 2)
    @DecimalMin(value = "0.00", message = "Balance cannot be negative")
    @Digits(integer = 17, fraction = 2, message = "Balance must have up to 17 digits before and 2 after the decimal point")
    @NotNull(message = "Balance cannot be null")
    private BigDecimal balance;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @NotNull(message = "Account status cannot be null")
    private AccountStatus status;
}

