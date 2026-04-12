package com.internetbank.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RegisterPushTokenRequest(
        @NotBlank(message = "Push token is required")
        String pushToken
) {
}
