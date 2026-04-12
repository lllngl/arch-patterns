package com.internetbank.account_service.configs;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    private static final String APP_NAME = "account-service-firebase";

    @Bean
    @ConditionalOnProperty(prefix = "app.firebase", name = "enabled", havingValue = "true")
    public FirebaseMessaging firebaseMessaging(FirebasePushProperties properties) throws IOException {
        if (properties.getCredentialsPath() == null || properties.getCredentialsPath().isBlank()) {
            throw new IllegalStateException("app.firebase.credentials-path must be configured when Firebase is enabled");
        }

        FirebaseApp firebaseApp = FirebaseApp.getApps().stream()
                .filter(app -> APP_NAME.equals(app.getName()))
                .findFirst()
                .orElseGet(() -> initializeApp(properties.getCredentialsPath()));

        return FirebaseMessaging.getInstance(firebaseApp);
    }

    private FirebaseApp initializeApp(String credentialsPath) {
        try (InputStream inputStream = new FileInputStream(credentialsPath)) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(inputStream))
                    .build();
            return FirebaseApp.initializeApp(options, APP_NAME);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to initialize Firebase messaging", exception);
        }
    }
}
