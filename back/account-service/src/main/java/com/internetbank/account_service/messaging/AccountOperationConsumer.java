package com.internetbank.account_service.messaging;

import com.internetbank.account_service.services.AccountOperationProcessingService;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccountOperationConsumer {

    private final AccountOperationProcessingService processingService;

    @KafkaListener(topics = "${app.kafka.topics.account-operation-commands}")
    public void consume(AccountOperationCommand command) {
        UsernamePasswordAuthenticationToken authentication = UsernamePasswordAuthenticationToken.authenticated(
                command.initiator().toAuthenticatedUser(),
                "kafka-command",
                java.util.List.of()
        );

        try {
            SecurityContextHolder.getContext().setAuthentication(authentication);
            processingService.processCommand(command);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
