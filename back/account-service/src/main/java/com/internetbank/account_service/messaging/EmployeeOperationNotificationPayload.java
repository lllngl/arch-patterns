package com.internetbank.account_service.messaging;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

public record EmployeeOperationNotificationPayload(
        String eventType,
        UUID operationRequestId,
        String operationType,
        UUID initiatedByUserId,
        Set<UUID> accountIds,
        Set<UUID> customerIds,
        LocalDateTime changedAt
) {
    public static EmployeeOperationNotificationPayload created(AccountTransactionsInvalidationEvent event,
                                                               Set<UUID> customerIds) {
        return new EmployeeOperationNotificationPayload(
                "ACCOUNT_OPERATION_CREATED",
                event.commandId(),
                event.operationType().name(),
                event.initiatedByUserId(),
                event.accountIds(),
                customerIds,
                event.emittedAt()
        );
    }
}
