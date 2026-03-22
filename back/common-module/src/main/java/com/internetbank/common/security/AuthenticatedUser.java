package com.internetbank.common.security;

import com.internetbank.common.enums.RoleName;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.With;
import org.springframework.security.core.GrantedAuthority;

import java.io.Serializable;
import java.util.Collection;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public final class AuthenticatedUser implements Serializable {

    private final UUID id;
    private final String keycloakUserId;
    private final String email;
    private final Set<RoleName> roles;
    @With
    private final boolean internalRequest;

    public static AuthenticatedUser external(UUID id, String keycloakUserId, String email, Set<RoleName> roles) {
        return new AuthenticatedUser(id, keycloakUserId, email, roles == null ? Set.of() : Set.copyOf(roles), false);
    }

    public static AuthenticatedUser internal() {
        return new AuthenticatedUser(null, null, "internal-service", EnumSet.noneOf(RoleName.class), true);
    }

    public static AuthenticatedUser fromAuthorities(UUID id,
                                                    String keycloakUserId,
                                                    String email,
                                                    Collection<? extends GrantedAuthority> authorities) {
        EnumSet<RoleName> roles = EnumSet.noneOf(RoleName.class);
        if (authorities != null) {
            for (GrantedAuthority authority : authorities) {
                if (authority == null || authority.getAuthority() == null) {
                    continue;
                }
                String value = authority.getAuthority();
                if (!value.startsWith("ROLE_")) {
                    continue;
                }
                try {
                    roles.add(RoleName.valueOf(value.substring("ROLE_".length())));
                } catch (IllegalArgumentException ignored) {
                    // Ignore non-domain roles such as ROLE_INTERNAL.
                }
            }
        }
        return external(id, keycloakUserId, email, roles);
    }

    public boolean hasRole(RoleName roleName) {
        return roleName != null && roles.contains(roleName);
    }
}