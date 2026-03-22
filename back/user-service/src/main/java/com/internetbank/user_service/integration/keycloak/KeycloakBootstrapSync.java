package com.internetbank.user_service.integration.keycloak;

import com.internetbank.user_service.models.User;
import com.internetbank.user_service.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class KeycloakBootstrapSync implements ApplicationRunner {

    private final UserRepository userRepository;
    private final KeycloakAdminService keycloakAdminService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        syncUnsyncedUsers();
    }

//    @Scheduled(fixedDelayString = "${keycloak.bootstrap.retry-delay-ms:60000}")
//    @Transactional
//    public void retryUnsyncedUsers() {
//        syncUnsyncedUsers();
//    }

    private void syncUnsyncedUsers() {
        for (User user : userRepository.findAll()) {
            try {
                keycloakAdminService.bootstrapUser(user);
                userRepository.saveAndFlush(user);
                log.info("Synchronized local user {} with Keycloak.", user.getEmail());
            } catch (RuntimeException ex) {
                log.error("Failed to synchronize local user {} with Keycloak. The application will continue to run, but this user remains out of sync until Keycloak becomes available.",
                        user.getEmail(), ex);
            }
        }
    }
}
