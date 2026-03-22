package com.internetbank.dto.response;

import lombok.Builder;

import java.util.Set;
import java.util.UUID;

@Builder
public record UserPreferencesResponse(

        UUID id,
        UUID userId,
        String deviceId,
        String theme,
        Set<UUID> hiddenAccountsIds
) {
}
