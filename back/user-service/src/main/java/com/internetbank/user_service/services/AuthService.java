package com.internetbank.user_service.services;

import com.internetbank.common.dtos.auth.AuthResponse;
import com.internetbank.common.dtos.auth.AuthRequest;
import com.internetbank.user_service.dto.UserRegisterDTO;

public interface AuthService {

    AuthResponse register(UserRegisterDTO userRegisterDTO);
    AuthResponse authenticate(AuthRequest authRequest);
    AuthResponse refreshToken(String refreshToken);
    void logout(String refreshToken);
}
