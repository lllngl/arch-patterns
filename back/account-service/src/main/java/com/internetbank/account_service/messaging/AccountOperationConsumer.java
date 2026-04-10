package com.internetbank.account_service.messaging;

import com.internetbank.account_service.services.AccountOperationProcessingService;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AccountOperationConsumer {

    private final AccountOperationProcessingService processingService;

    @KafkaListener(topics = "${app.kafka.topics.account-operation-commands}")
    public void consume(AccountOperationCommand command, Acknowledgment acknowledgment) {
        UsernamePasswordAuthenticationToken authentication = UsernamePasswordAuthenticationToken.authenticated(
                command.initiator().toAuthenticatedUser(),
                "kafka-command",
                java.util.List.of()
        );

        try {
            SecurityContextHolder.getContext().setAuthentication(authentication);
            processWithRetry(command);
            acknowledgment.acknowledge();
            log.debug("Command {} processed successfully", command.commandId());
        } catch (Exception ex) {
            log.error("Failed to process command {} after retries", command.commandId(), ex);
            throw ex;
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Retry(name = "kafka-consumer", fallbackMethod = "processFallback")
    private void processWithRetry(AccountOperationCommand command) {
        processingService.processCommand(command);
    }

    private void processFallback(AccountOperationCommand command, Exception ex) {
        log.error("All retries exhausted for command {}", command.commandId(), ex);
        throw new RuntimeException("Failed to process command after all retries", ex);
    }
}
