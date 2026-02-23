package com.internetbank.user_service.services.impl;

import com.internetbank.common.dtos.auth.AuthResponse;
import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.exceptions.BadRequestException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.common.exceptions.UnauthorizedException;
import com.internetbank.common.security.JwtService;
import com.internetbank.user_service.mappers.UserMapper;
import com.internetbank.user_service.models.Token;
import com.internetbank.user_service.models.User;
import com.internetbank.user_service.repositories.TokenRepository;
import com.internetbank.user_service.repositories.UserRepository;
import com.internetbank.user_service.services.TokenService;
import lombok.RequiredArgsConstructor;
import io.jsonwebtoken.JwtException;
import lombok.extern.slf4j.Slf4j;
import com.internetbank.common.exceptions.InternalServerErrorException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenServiceImpl implements TokenService {

    private final JwtService jwtService;
    private final TokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Value("${jwt.refresh-token-replay-blacklist-duration}")
    private Duration refreshTokenReplayBlacklistDuration;

    @Value("${jwt.refresh-token-duration}")
    private Duration lifetime;

    @Override
    @Transactional
    public AuthResponse getTokens(UserDTO user) {
        AuthResponse tokensPair = jwtService.getTokensPair(user);

        Token refresh = getRefreshTokenEntity(tokensPair.refreshToken());
        tokenRepository.save(refresh);
        return tokensPair;
    }

    @Override
    @Transactional
    public AuthResponse refreshAccessToken(String refreshToken) {
        String refreshTokenId = null;
        try {
            refreshTokenId = jwtService.extractTokenId(refreshToken);
        } catch (JwtException | IllegalArgumentException e) {
            throw new UnauthorizedException("Invalid refresh token format. Please log in again.");
        }

        if (!isRefreshTokenValid(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token. Please log in again.");
        }

        Token oldRefreshTokenEntity = tokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new NotFoundException("Refresh token not found in database. It may have been revoked or already used."));

        tokenRepository.deleteById(oldRefreshTokenEntity.getId());

        UUID userId = null;
        try {
            userId = jwtService.extractUserId(refreshToken);
        } catch (JwtException e) {
            throw new UnauthorizedException("Failed to extract user information from refresh token.");
        }

        User user = userRepository.findById(userId).orElseThrow(()
                -> new NotFoundException("User associated with the refresh token not found."));

        return getTokens(userMapper.userToUserDto(user));
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadRequestException("Refresh token cannot be empty.");
        }
        if (!isRefreshTokenValid(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token. Please log in again.");
        }
        tokenRepository.deleteByToken(refreshToken);
        log.debug("Refresh token invalidated (logout).");
    }

    @Override
    @Transactional
    public void invalidateAllUserSessions(UUID userId) {
        if (userId == null) {
            throw new BadRequestException("User ID cannot be null for session invalidation.");
        }

        try {
            tokenRepository.deleteAllByUserId(userId);
        } catch (EmptyResultDataAccessException e) {
            log.warn("No tokens to delete for user {}", userId);
        } catch (Exception e) {
            log.error("Failed to delete tokens for user {}", userId, e);
            throw new InternalServerErrorException("Session invalidation failed.");
        }

    }

    private boolean isRefreshTokenValid(String refreshToken) {
        try {
            jwtService.validateToken(refreshToken);

            if (jwtService.isTokenExpired(refreshToken)) {
                return false;
            }

            return tokenRepository.findByToken(refreshToken)
                    .map(token -> {
                        boolean isValid = token.getExpirationDateTime().isAfter(Instant.now());
                        if (!isValid) {
                            log.debug("Refresh token found in DB but is past its database expiration date.");
                        }
                        return isValid;
                    })
                    .orElseGet(() -> {
                        log.debug("Refresh token not found in database during validation.");
                        return false;
                    });

        } catch (JwtException e) {
            log.debug("JWT validation failed for refresh token: {}", e.getMessage());
            return false;
        } catch (IllegalArgumentException e) {
            log.debug("Illegal argument during refresh token validation: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Unexpected error during refresh token validation: {}", e.getMessage(), e);
            return false;
        }
    }

    private Token getRefreshTokenEntity(String token){
        UUID userId = null;
        String tokenId = null;
        try {
            userId = jwtService.extractUserId(token);
            tokenId = jwtService.extractTokenId(token);
        } catch (JwtException e) {
            throw new UnauthorizedException("Invalid token provided for creating refresh token entity.");
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new UnauthorizedException("Invalid user details for token creation."));

        return Token.builder()
                .user(user)
                .token(token)
                .tokenId(UUID.fromString(tokenId))
                .expirationDateTime(Instant.now().plus(lifetime))
                .build();
    }

    @Scheduled(fixedRate = 86400000)
    @Transactional
    public void cleanupExpiredTokens() {
        Instant now = Instant.now();
        tokenRepository.deleteAllByExpirationDateTimeBefore(now);
    }
}
