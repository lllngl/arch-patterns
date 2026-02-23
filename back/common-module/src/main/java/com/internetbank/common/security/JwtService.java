package com.internetbank.common.security;

import com.internetbank.common.dtos.auth.AuthResponse;
import com.internetbank.common.dtos.UserDTO;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-duration}")
    private Duration accessTokenExpirationMs;

    @Value("${jwt.refresh-token-duration}")
    private Duration refreshTokenExpirationMs;

    private SecretKey signKey;

    @PostConstruct
    public void init() {
        this.signKey = getSignKeyFromSecret();
    }

    private String generateToken(Map<String, Object> claims, String subject, UUID tokenId, Duration expiration) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setId(tokenId.toString())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration.toMillis()))
                .signWith(this.signKey, SignatureAlgorithm.HS256)
                .compact();
    }


    public SecretKey getSignKeyFromSecret() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private Map<String, Object> createUserClaims(UserDTO user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.id().toString());

        claims.put("roles", user.role() == null
                ? List.of()
                : List.of(user.role().name()));
        return claims;
    }

    public String generateAccessToken(UserDTO user, UUID tokenId) {
        return generateToken(createUserClaims(user), user.email(), tokenId, accessTokenExpirationMs);
    }

    public String generateRefreshToken(UserDTO user, UUID tokenId) {
        return generateToken(createUserClaims(user), user.email(), tokenId, refreshTokenExpirationMs);
    }

    public AuthResponse getTokensPair(UserDTO userDTO) {
        UUID tokenId = UUID.randomUUID();
        return new AuthResponse(generateAccessToken(userDTO, tokenId), generateRefreshToken(userDTO, tokenId));
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(extractClaim(token, claims -> claims.get("userId", String.class)));
    }

    public String extractSubject(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractTokenId(String token) {
        return extractClaim(token, Claims::getId);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public String extractRoles(String token) {
        List<?> rolesList = extractClaim(token, claims -> claims.get("roles", List.class));
        if (rolesList == null || rolesList.isEmpty()) {
            return "";
        }

        return rolesList.stream()
                .map(Object::toString)
                .collect(Collectors.joining(","));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(this.signKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public void validateToken(String token) throws ExpiredJwtException, SignatureException, IllegalArgumentException {
        try {
            Jwts.parser()
                    .verifyWith(this.signKey)
                    .build()
                    .parseSignedClaims(token);
        } catch (ExpiredJwtException e) {
            log.warn("Token is expired: {}", e.getMessage());
            throw e;
        } catch (SignatureException e) {
            log.warn("Invalid token signature: {}", e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            log.warn("Authentication error: {}", e.getMessage());
            throw e;
        }
    }
}