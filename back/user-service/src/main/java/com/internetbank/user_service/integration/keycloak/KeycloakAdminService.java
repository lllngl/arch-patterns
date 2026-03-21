package com.internetbank.user_service.integration.keycloak;

import com.internetbank.common.enums.RoleName;
import com.internetbank.common.exceptions.DuplicateResourceException;
import com.internetbank.common.exceptions.InternalServerErrorException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.user_service.config.KeycloakAdminProperties;
import com.internetbank.user_service.models.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Slf4j
public class KeycloakAdminService {

    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_OF_MAPS =
            new ParameterizedTypeReference<>() {};
    private static final int ADMIN_TOKEN_RETRY_ATTEMPTS = 5;
    private static final long ADMIN_TOKEN_RETRY_DELAY_MS = 1500L;

    private final KeycloakAdminProperties properties;
    private final RestClient restClient;

    @Autowired
    public KeycloakAdminService(KeycloakAdminProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.getConnectTimeoutMs());
        requestFactory.setReadTimeout(properties.getReadTimeoutMs());
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    public String createUser(User user) {
        String accessToken = getAdminAccessToken();
        try {
            URI location = restClient.post()
                    .uri(properties.adminUsersUri())
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                    .body(buildCreateUserRepresentation(user))
                    .retrieve()
                    .toBodilessEntity()
                    .getHeaders()
                    .getLocation();

            if (location == null) {
                throw new InternalServerErrorException("Keycloak did not return a new user location.");
            }

            String keycloakUserId = location.getPath().substring(location.getPath().lastIndexOf('/') + 1);
            syncRealmRoles(keycloakUserId, user.getRoles(), accessToken);
            return keycloakUserId;
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 409) {
                String existingUserId = findExistingUserIdByEmail(user.getEmail(), accessToken);
                if (existingUserId == null) {
                    throw new DuplicateResourceException("Keycloak user with email '" + user.getEmail() + "' already exists.");
                }
                log.info("Keycloak user {} already exists. Linking local user {} to existing Keycloak account {}.",
                        user.getEmail(), user.getId(), existingUserId);
                syncUserRepresentation(existingUserId, user, accessToken);
                syncRealmRoles(existingUserId, user.getRoles(), accessToken);
                return existingUserId;
            }
            throw new InternalServerErrorException("Failed to create user in Keycloak.");
        }
    }

    public void syncUser(User user) {
        ensureHasKeycloakId(user);
        String accessToken = getAdminAccessToken();
        try {
            syncUserRepresentation(user.getKeycloakUserId(), user, accessToken);
            syncRealmRoles(user.getKeycloakUserId(), user.getRoles(), accessToken);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404) {
                throw new NotFoundException("Keycloak user not found: " + user.getKeycloakUserId());
            }
            if (ex.getStatusCode().value() == 409) {
                throw new DuplicateResourceException("Keycloak user with email '" + user.getEmail() + "' already exists.");
            }
            throw new InternalServerErrorException("Failed to sync user with Keycloak.");
        }
    }

    public void deleteUser(String keycloakUserId) {
        if (keycloakUserId == null || keycloakUserId.isBlank()) {
            return;
        }
        String accessToken = getAdminAccessToken();
        try {
            restClient.delete()
                    .uri(properties.adminUserUri(keycloakUserId))
                    .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() != 404) {
                throw new InternalServerErrorException("Failed to delete Keycloak user.");
            }
        }
    }

    public void bootstrapUser(User user) {
        if (user.getKeycloakUserId() == null || user.getKeycloakUserId().isBlank()) {
            user.setKeycloakUserId(createUser(user));
            return;
        }
        syncUser(user);
    }

    private void syncUserRepresentation(String keycloakUserId, User user, String accessToken) {
        restClient.put()
                .uri(properties.adminUserUri(keycloakUserId))
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                .body(buildUserRepresentation(user))
                .retrieve()
                .toBodilessEntity();
    }

    private void syncRealmRoles(String keycloakUserId, Collection<?> desiredRoles, String accessToken) {
        Set<String> desiredRoleNames = desiredRoles == null
                ? Set.of()
                : desiredRoles.stream()
                .map(role -> role instanceof com.internetbank.user_service.models.Role r ? r.getRolename().name() : String.valueOf(role))
                .collect(java.util.stream.Collectors.toSet());

        List<Map<String, Object>> currentRoles = restClient.get()
                .uri(properties.adminUserRealmRolesUri(keycloakUserId))
                .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                .retrieve()
                .body(LIST_OF_MAPS);

        Set<String> currentRoleNames = currentRoles == null
                ? Set.of()
                : currentRoles.stream()
                .map(role -> String.valueOf(role.get("name")))
                .filter(name -> {
                    try {
                        RoleName.valueOf(name);
                        return true;
                    } catch (IllegalArgumentException ignored) {
                        return false;
                    }
                })
                .collect(java.util.stream.Collectors.toSet());

        Set<String> rolesToAdd = new java.util.HashSet<>(desiredRoleNames);
        rolesToAdd.removeAll(currentRoleNames);

        Set<String> rolesToRemove = new java.util.HashSet<>(currentRoleNames);
        rolesToRemove.removeAll(desiredRoleNames);

        if (!rolesToAdd.isEmpty()) {
            log.info("Assigning Keycloak realm roles {} to user {}.", rolesToAdd, keycloakUserId);
            restClient.post()
                    .uri(properties.adminUserRealmRolesUri(keycloakUserId))
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                    .body(loadRoleRepresentations(rolesToAdd, accessToken))
                    .retrieve()
                    .toBodilessEntity();
        }

        if (!rolesToRemove.isEmpty()) {
            log.info("Removing Keycloak realm roles {} from user {}.", rolesToRemove, keycloakUserId);
            restClient.method(HttpMethod.DELETE)
                    .uri(properties.adminUserRealmRolesUri(keycloakUserId))
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                    .body(loadRoleRepresentations(rolesToRemove, accessToken))
                    .retrieve()
                    .toBodilessEntity();
        }
    }

    private List<KeycloakRoleRepresentation> loadRoleRepresentations(Set<String> roleNames, String accessToken) {
        return roleNames.stream()
                .map(roleName -> toRoleRepresentation(restClient.get()
                        .uri(properties.adminRealmRoleUri(roleName))
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .retrieve()
                        .body(new ParameterizedTypeReference<Map<String, Object>>() {})))
                .toList();
    }

    private KeycloakRoleRepresentation toRoleRepresentation(Map<String, Object> role) {
        if (role == null || role.isEmpty()) {
            throw new InternalServerErrorException("Failed to load Keycloak realm role representation.");
        }

        return new KeycloakRoleRepresentation(
                String.valueOf(role.get("id")),
                String.valueOf(role.get("name")),
                Boolean.TRUE.equals(role.get("composite")),
                Boolean.TRUE.equals(role.get("clientRole")),
                String.valueOf(role.get("containerId"))
        );
    }

    private String findExistingUserIdByEmail(String email, String accessToken) {
        List<Map<String, Object>> users = searchUsers("?email=", email, accessToken);

        if (users == null || users.isEmpty()) {
            users = searchUsers("?search=", email, accessToken);
        }

        if (users == null || users.isEmpty()) {
            return null;
        }

        return users.stream()
                .filter(user -> email.equalsIgnoreCase(String.valueOf(user.get("email"))))
                .map(user -> String.valueOf(user.get("id")))
                .findFirst()
                .orElse(null);
    }

    private List<Map<String, Object>> searchUsers(String queryPrefix, String value, String accessToken) {
        return restClient.get()
                .uri(properties.adminUsersUri() + queryPrefix + URLEncoder.encode(value, StandardCharsets.UTF_8))
                .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                .retrieve()
                .body(LIST_OF_MAPS);
    }

    private Map<String, Object> buildUserRepresentation(User user) {
        return Map.of(
                "username", user.getEmail(),
                "email", user.getEmail(),
                "enabled", !user.isBlocked(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "requiredActions", List.of("UPDATE_PASSWORD"),
                "attributes", buildAttributes(user)
        );
    }

    private Map<String, Object> buildCreateUserRepresentation(User user) {
        Map<String, Object> representation = new java.util.LinkedHashMap<>(buildUserRepresentation(user));
        representation.put("credentials", List.of(buildTemporaryPasswordCredential()));
        return representation;
    }

    private Map<String, Object> buildTemporaryPasswordCredential() {
        return Map.of(
                "type", "password",
                "value", properties.getInitialTemporaryPassword(),
                "temporary", true
        );
    }

    private Map<String, List<String>> buildAttributes(User user) {
        return Map.of(
                "user_id", List.of(user.getId().toString()),
                "patronymic", List.of(nullToEmpty(user.getPatronymic())),
                "phone", List.of(user.getPhone() == null ? "" : String.valueOf(user.getPhone())),
                "gender", List.of(user.getGender() == null ? "" : user.getGender().name()),
                "birth_date", List.of(user.getBirthDate() == null ? "" : user.getBirthDate().toString())
        );
    }

    private String getAdminAccessToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", properties.getAdmin().getClientId());
        form.add("client_secret", properties.getAdmin().getClientSecret());

        ResourceAccessException lastAccessException = null;
        for (int attempt = 1; attempt <= ADMIN_TOKEN_RETRY_ATTEMPTS; attempt++) {
            try {
                 KeycloakTokenResponse response = restClient.post()
                        .uri(properties.tokenUri())
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(form)
                        .retrieve()
                        .body(KeycloakTokenResponse.class);

                if (response == null || response.accessToken() == null || response.accessToken().isBlank()) {
                    throw new InternalServerErrorException("Failed to obtain Keycloak admin access token.");
                }
                return response.accessToken();
            } catch (RestClientResponseException ex) {
                throw new InternalServerErrorException(
                        "Failed to authenticate user-service against Keycloak at '%s' with client '%s' (status %s). Response: %s"
                                .formatted(
                                        properties.tokenUri(),
                                        properties.getAdmin().getClientId(),
                                        ex.getStatusCode(),
                                        ex.getResponseBodyAsString()
                                )
                );
            } catch (ResourceAccessException ex) {
                lastAccessException = ex;
                if (attempt == ADMIN_TOKEN_RETRY_ATTEMPTS) {
                    break;
                }
                sleepBeforeRetry();
            }
        }

        throw new InternalServerErrorException(
                "Failed to reach Keycloak token endpoint '%s' for client '%s' after %d attempts. Root cause: %s"
                        .formatted(
                                properties.tokenUri(),
                                properties.getAdmin().getClientId(),
                                ADMIN_TOKEN_RETRY_ATTEMPTS,
                                lastAccessException == null ? "unknown I/O error" : lastAccessException.getMessage()
                        )
        );
    }

    private void sleepBeforeRetry() {
        try {
            Thread.sleep(ADMIN_TOKEN_RETRY_DELAY_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new InternalServerErrorException("Interrupted while waiting to retry Keycloak connection.");
        }
    }

    private void ensureHasKeycloakId(User user) {
        if (user.getKeycloakUserId() == null || user.getKeycloakUserId().isBlank()) {
            throw new NotFoundException("User is not linked to Keycloak.");
        }
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private record KeycloakTokenResponse(String access_token) {
        String accessToken() {
            return access_token;
        }
    }

    private record KeycloakRoleRepresentation(
            String id,
            String name,
            boolean composite,
            boolean clientRole,
            String containerId
    ) {
    }
}
