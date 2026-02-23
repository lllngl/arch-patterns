package com.internetbank.user_service.services;

import com.internetbank.common.dtos.auth.AuthResponse;
import com.internetbank.common.dtos.UserDTO;

import java.util.UUID;

public interface TokenService {
    AuthResponse getTokens(UserDTO user);
    AuthResponse refreshAccessToken(String refreshToken);
    void logout(String refreshToken);
    void invalidateAllUserSessions(UUID userId);
}
