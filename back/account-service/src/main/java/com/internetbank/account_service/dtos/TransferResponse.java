package com.internetbank.account_service.dtos;

import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.enums.CurrencyCode;

import java.math.BigDecimal;
import java.util.UUID;

public record TransferResponse(
        UUID transferId,
        AccountDTO sourceAccount,
        AccountDTO targetAccount,
        BigDecimal operationAmount,
        CurrencyCode operationCurrency,
        BigDecimal debitedAmount,
        BigDecimal commissionAmount,
        BigDecimal creditedAmount,
        CurrencyCode sourceCurrency,
        CurrencyCode targetCurrency,
        CurrencyCode bankCurrency
) {
}
