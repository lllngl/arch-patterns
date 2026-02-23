package com.internetbank.user_service.services.impl;

import com.internetbank.common.dtos.auth.AuthResponse;
import com.internetbank.common.dtos.auth.AuthRequest;
import com.internetbank.common.enums.RoleName;
import com.internetbank.common.exceptions.DuplicateResourceException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.common.exceptions.UnauthorizedException;
import com.internetbank.user_service.dto.UserRegisterDTO;
import com.internetbank.user_service.mappers.UserMapper;
import com.internetbank.user_service.models.Role;
import com.internetbank.user_service.models.User;
import com.internetbank.user_service.repositories.RoleRepository;
import com.internetbank.user_service.repositories.UserRepository;
import com.internetbank.user_service.services.AuthService;
import com.internetbank.user_service.services.TokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final TokenService tokenService;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public AuthResponse register(UserRegisterDTO userRegisterDTO) {

        if (userRepository.findByEmail(userRegisterDTO.getEmail()).isPresent()) {
            throw new DuplicateResourceException("User with email '" + userRegisterDTO.getEmail() + "' already exists.");
        }

        User user = userMapper.userRegisterDtoToUser(userRegisterDTO);

        Role clientRole = roleRepository.findByRolename(RoleName.CLIENT)
                .orElseThrow(() -> new NotFoundException("Role CLIENT not found. Please ensure default roles are configured."));
        user.setRole(clientRole);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User newUser = userRepository.saveAndFlush(user);
        return tokenService.getTokens(userMapper.userToUserDto(newUser));
    }

    @Override
    public AuthResponse authenticate(AuthRequest authRequest) {
        User user = userRepository.findByEmail(authRequest.login())
                .orElseThrow(() -> new UnauthorizedException("Invalid login credentials."));

        if (user.isBlocked())
        {
            throw new UnauthorizedException("User is blocked.");
        }

        if (!passwordEncoder.matches(authRequest.password(), user.getPassword())) {
            throw new UnauthorizedException("Invalid login credentials.");
        }

        return tokenService.getTokens(userMapper.userToUserDto(user));
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        return tokenService.refreshAccessToken(refreshToken);
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        tokenService.logout(refreshToken);
    }
}
