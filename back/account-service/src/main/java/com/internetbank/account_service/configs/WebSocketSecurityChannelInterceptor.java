package com.internetbank.account_service.configs;

import com.internetbank.account_service.services.AccountRealtimeAccessService;
import com.internetbank.common.security.AuthenticatedUser;
import com.internetbank.common.security.KeycloakJwtAuthenticationConverter;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class WebSocketSecurityChannelInterceptor implements ChannelInterceptor {

    private static final String ACCOUNT_TRANSACTIONS_DESTINATION_PREFIX = "/topic/accounts/";
    private static final String ACCOUNT_TRANSACTIONS_DESTINATION_SUFFIX = "/transactions";
    private final JwtDecoder jwtDecoder;
    private final KeycloakJwtAuthenticationConverter keycloakJwtAuthenticationConverter;
    private final AccountRealtimeAccessService accountRealtimeAccessService;
    private final Map<String, Authentication> sessionAuthentications = new ConcurrentHashMap<>();

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            Authentication authentication = authenticate(accessor);
            accessor.setUser(authentication);
            if (accessor.getSessionId() != null) {
                sessionAuthentications.put(accessor.getSessionId(), authentication);
            }
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            Authentication authentication = resolveAuthentication(accessor);
            if (!(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
                throw new AccessDeniedException("Authentication is required for WebSocket subscriptions.");
            }

            UUID accountId = extractAccountId(accessor.getDestination());
            accountRealtimeAccessService.ensureCanSubscribe(accountId, authenticatedUser);
        }

        if (StompCommand.DISCONNECT.equals(accessor.getCommand()) && accessor.getSessionId() != null) {
            sessionAuthentications.remove(accessor.getSessionId());
        }

        return message;
    }

    private UsernamePasswordAuthenticationToken authenticate(StompHeaderAccessor accessor) {
        List<String> authorizationHeaders = accessor.getNativeHeader("Authorization");
        if (authorizationHeaders == null || authorizationHeaders.isEmpty()) {
            authorizationHeaders = accessor.getNativeHeader("authorization");
        }
        if (authorizationHeaders == null || authorizationHeaders.isEmpty()) {
            throw new AccessDeniedException("Authorization header is required.");
        }

        String bearerToken = authorizationHeaders.get(0);
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            throw new AccessDeniedException("Bearer token is required.");
        }

        Jwt jwt = jwtDecoder.decode(bearerToken.substring("Bearer ".length()));
        return keycloakJwtAuthenticationConverter.convert(jwt);
    }

    private Authentication resolveAuthentication(StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof Authentication authentication) {
            return authentication;
        }
        if (accessor.getSessionId() != null) {
            Authentication storedAuthentication = sessionAuthentications.get(accessor.getSessionId());
            if (storedAuthentication != null) {
                accessor.setUser(storedAuthentication);
                return storedAuthentication;
            }
        }
        throw new AccessDeniedException("Authentication is required for WebSocket subscriptions.");
    }

    private UUID extractAccountId(String destination) {
        if (destination == null
                || !destination.startsWith(ACCOUNT_TRANSACTIONS_DESTINATION_PREFIX)
                || !destination.endsWith(ACCOUNT_TRANSACTIONS_DESTINATION_SUFFIX)) {
            throw new AccessDeniedException("Unsupported subscription destination.");
        }

        String accountId = destination.substring(
                ACCOUNT_TRANSACTIONS_DESTINATION_PREFIX.length(),
                destination.length() - ACCOUNT_TRANSACTIONS_DESTINATION_SUFFIX.length()
        );
        try {
            return UUID.fromString(accountId);
        } catch (IllegalArgumentException exception) {
            throw new AccessDeniedException("Unsupported subscription destination.");
        }
    }
}
