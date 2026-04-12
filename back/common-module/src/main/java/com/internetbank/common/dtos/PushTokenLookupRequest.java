package com.internetbank.common.dtos;

import jakarta.validation.constraints.NotEmpty;

import java.util.Set;
import java.util.UUID;

public record PushTokenLookupRequest(
        @NotEmpty(message = "User IDs are required")
        Set<UUID> userIds
) {
}
