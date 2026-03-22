package com.internetbank.common.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

public record OperationAcceptedResponse(
        UUID operationRequestId,
        String status,
        String message,
        LocalDateTime submittedAt
) {
    public static OperationAcceptedResponse accepted(UUID operationRequestId, String message, LocalDateTime submittedAt) {
        return new OperationAcceptedResponse(operationRequestId, "ACCEPTED", message, submittedAt);
    }
}
