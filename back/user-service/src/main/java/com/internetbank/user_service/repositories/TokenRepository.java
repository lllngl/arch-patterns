package com.internetbank.user_service.repositories;

import com.internetbank.user_service.models.Token;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TokenRepository extends JpaRepository<Token, UUID> {
    void deleteAllByExpirationDateTimeBefore(Instant dateTime);
    Optional<Token> findByToken(String token);
    List<Token> findAllByUserId(UUID userId);
    void deleteByToken(String token);
    void deleteByTokenId(UUID tokenId);
    void deleteAllByUserId(UUID userId);
    boolean existsByUserId(UUID userId);
}