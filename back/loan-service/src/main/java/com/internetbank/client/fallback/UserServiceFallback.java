package com.internetbank.client.fallback;

import com.internetbank.client.UserServiceClient;
import com.internetbank.common.dtos.UserDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class UserServiceFallback implements FallbackFactory<UserServiceClient> {

    @Override
    public UserServiceClient create(Throwable cause) {
        log.error("User service is unavailable: {}", cause.getMessage());

        return new UserServiceClient() {
            @Override
            public ResponseEntity<UserDTO> getUser(UUID userId) {
                log.warn("Fallback: getUser({}) - service unavailable", userId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            @Override
            public ResponseEntity<UserDTO> getUserByEmail(String email) {
                log.warn("Fallback: getUserByEmail({}) - service unavailable", email);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            @Override
            public ResponseEntity<List<UserDTO>> getAllUsers() {
                log.warn("Fallback: getAllUsers() - service unavailable");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Collections.emptyList());
            }

            @Override
            public ResponseEntity<Boolean> userExists(UUID userId) {
                log.warn("Fallback: userExists({}) - service unavailable", userId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            @Override
            public ResponseEntity<String> getUserRole(UUID userId) {
                log.warn("Fallback: getUserRole({}) - service unavailable", userId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            @Override
            public ResponseEntity<Void> blockUser(UUID userId) {
                log.warn("Fallback: blockUser({}) - service unavailable", userId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            @Override
            public ResponseEntity<Void> unblockUser(UUID userId) {
                log.warn("Fallback: unblockUser({}) - service unavailable", userId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }
        };
    }
}