package com.internetbank.account_service.messaging;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

public record AccountTransactionsInvalidationEvent(
        UUID commandId,
        AccountOperationCommandType operationType,
        UUID initiatedByUserId,
        Set<UUID> accountIds,
        LocalDateTime emittedAt
) {
}
