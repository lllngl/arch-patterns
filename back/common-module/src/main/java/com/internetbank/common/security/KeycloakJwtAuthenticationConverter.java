package com.internetbank.common.security;

import com.internetbank.common.enums.RoleName;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, UsernamePasswordAuthenticationToken> {

    @Override
    public UsernamePasswordAuthenticationToken convert(Jwt jwt) {
        List<GrantedAuthority> authorities = extractAuthorities(jwt);
        AuthenticatedUser principal = AuthenticatedUser.fromAuthorities(
                extractUserId(jwt),
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                authorities
        );
        return UsernamePasswordAuthenticationToken.authenticated(principal, jwt.getTokenValue(), authorities);
    }

    private List<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Set<String> roles = new HashSet<>();
        roles.addAll(readRealmRoles(jwt));
        roles.addAll(readFlatRoles(jwt));

        return roles.stream()
                .map(String::trim)
                .filter(role -> !role.isBlank())
                .map(String::toUpperCase)
                .distinct()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .map(GrantedAuthority.class::cast)
                .toList();
    }

    @SuppressWarnings("unchecked")
    private Collection<String> readRealmRoles(Jwt jwt) {
        Object claim = jwt.getClaims().get("realm_access");
        if (!(claim instanceof Map<?, ?> realmAccess)) {
            return List.of();
        }
        Object roles = realmAccess.get("roles");
        if (roles instanceof Collection<?> collection) {
            return collection.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private Collection<String> readFlatRoles(Jwt jwt) {
        Object claim = jwt.getClaims().get("roles");
        if (claim instanceof Collection<?> collection) {
            return collection.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    private UUID extractUserId(Jwt jwt) {
        String userId = jwt.getClaimAsString("user_id");
        if (userId == null || userId.isBlank()) {
            return null;
        }
        return UUID.fromString(userId);
    }
}
