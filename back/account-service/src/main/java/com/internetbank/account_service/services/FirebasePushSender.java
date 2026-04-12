package com.internetbank.account_service.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MulticastMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class FirebasePushSender {

    private static final int MAX_MULTICAST_BATCH_SIZE = 500;

    private final ObjectMapper objectMapper;
    private final org.springframework.beans.factory.ObjectProvider<FirebaseMessaging> firebaseMessagingProvider;

    public boolean isEnabled() {
        return firebaseMessagingProvider.getIfAvailable() != null;
    }

    public void sendToTopic(String topic, String eventType, Object payload) {
        FirebaseMessaging firebaseMessaging = firebaseMessagingProvider.getIfAvailable();
        if (firebaseMessaging == null || topic == null || topic.isBlank()) {
            return;
        }

        try {
            firebaseMessaging.send(Message.builder()
                    .putAllData(buildData(eventType, payload))
                    .setTopic(topic)
                    .build());
        } catch (Exception exception) {
            log.warn("Failed to send Firebase topic notification to {}: {}", topic, exception.getMessage());
        }
    }

    public void sendToTokens(Collection<String> tokens, String eventType, Object payload) {
        FirebaseMessaging firebaseMessaging = firebaseMessagingProvider.getIfAvailable();
        if (firebaseMessaging == null || tokens == null || tokens.isEmpty()) {
            return;
        }

        List<String> distinctTokens = tokens.stream()
                .filter(token -> token != null && !token.isBlank())
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toCollection(LinkedHashSet::new),
                        List::copyOf
                ));

        if (distinctTokens.isEmpty()) {
            return;
        }

        Map<String, String> data = buildData(eventType, payload);
        for (int index = 0; index < distinctTokens.size(); index += MAX_MULTICAST_BATCH_SIZE) {
            int endIndex = Math.min(index + MAX_MULTICAST_BATCH_SIZE, distinctTokens.size());
            try {
                firebaseMessaging.sendEachForMulticast(MulticastMessage.builder()
                        .putAllData(data)
                        .addAllTokens(distinctTokens.subList(index, endIndex))
                        .build());
            } catch (Exception exception) {
                log.warn("Failed to send Firebase multicast notification: {}", exception.getMessage());
            }
        }
    }

    private Map<String, String> buildData(String eventType, Object payload) {
        try {
            return Map.of(
                    "eventType", eventType,
                    "payload", objectMapper.writeValueAsString(payload)
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Failed to serialize Firebase payload", exception);
        }
    }
}
