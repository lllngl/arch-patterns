package com.internetbank.common.dtos.auth;
import lombok.Builder;

@Builder
public record AuthResponse(
        String accessToken,
        String refreshToken
) {}

