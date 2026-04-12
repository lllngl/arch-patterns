package com.internetbank.common.dtos;

import java.util.UUID;

public record PushTokenRecordResponse(
        UUID userId,
        String deviceId,
        String pushToken
) {
}
