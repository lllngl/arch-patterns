package com.internetbank.account_service.messaging;

import java.time.LocalDateTime;
import java.util.UUID;

public record AccountTransactionsInvalidationPayload(
        String eventType,
        UUID operationRequestId,
        UUID accountId,
        LocalDateTime changedAt
) {
    public static AccountTransactionsInvalidationPayload created(UUID operationRequestId, UUID accountId, LocalDateTime changedAt) {
        return new AccountTransactionsInvalidationPayload(
                "TRANSACTIONS_INVALIDATED",
                operationRequestId,
                accountId,
                changedAt
        );
    }
}
