package com.internetbank.account_service.messaging;

import com.internetbank.common.enums.CurrencyCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AccountOperationCommand(
        UUID commandId,
        AccountOperationCommandType type,
        OperationCommandInitiator initiator,
        UUID accountId,
        UUID relatedAccountId,
        BigDecimal amount,
        CurrencyCode operationCurrency,
        LocalDateTime submittedAt
) {
}
