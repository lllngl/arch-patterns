package com.internetbank.account_service.messaging;

import com.internetbank.common.enums.RoleName;
import com.internetbank.common.security.AuthenticatedUser;

import java.util.Set;
import java.util.UUID;

public record OperationCommandInitiator(
        UUID userId,
        String keycloakUserId,
        String email,
        Set<RoleName> roles,
        boolean internalRequest
) {
    public static OperationCommandInitiator from(AuthenticatedUser user) {
        return new OperationCommandInitiator(
                user.getId(),
                user.getKeycloakUserId(),
                user.getEmail(),
                user.getRoles(),
                user.isInternalRequest()
        );
    }

    public AuthenticatedUser toAuthenticatedUser() {
        if (internalRequest) {
            return AuthenticatedUser.internal();
        }
        return AuthenticatedUser.external(userId, keycloakUserId, email, roles);
    }
}
