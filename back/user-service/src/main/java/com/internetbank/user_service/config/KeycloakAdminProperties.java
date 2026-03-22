package com.internetbank.user_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@Getter
@Setter
@ConfigurationProperties(prefix = "keycloak")
public class KeycloakAdminProperties {

    private String serverUrl;
    private String realm;
    private Admin admin = new Admin();
    private int connectTimeoutMs = 5000;
    private int readTimeoutMs = 10000;
    private String initialTemporaryPassword = "string1";

    public void setServerUrl(String serverUrl) {
        this.serverUrl = trimTrailingSlash(serverUrl);
    }

    public String tokenUri() {
        return serverUrl + "/realms/" + realm + "/protocol/openid-connect/token";
    }

    public String adminUsersUri() {
        return serverUrl + "/admin/realms/" + realm + "/users";
    }

    public String adminUserUri(String keycloakUserId) {
        return adminUsersUri() + "/" + keycloakUserId;
    }

    public String adminRealmRoleUri(String roleName) {
        return serverUrl + "/admin/realms/" + realm + "/roles/" + roleName;
    }

    public String adminUserRealmRolesUri(String keycloakUserId) {
        return adminUserUri(keycloakUserId) + "/role-mappings/realm";
    }

    private String trimTrailingSlash(String value) {
        if (value == null) {
            return null;
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    @Getter
    @Setter
    public static class Admin {
        private String clientId;
        private String clientSecret;
    }
}
