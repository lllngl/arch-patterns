package com.internetbank.account_service.messaging;

import com.internetbank.common.exceptions.InternalServerErrorException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class AccountOperationProducer {

    private final KafkaTemplate<String, AccountOperationCommand> kafkaTemplate;

    @Value("${app.kafka.topics.account-operation-commands}")
    private String accountOperationCommandsTopic;

    @CircuitBreaker(name = "kafka-producer", fallbackMethod = "sendFallback")
    @Retry(name = "kafka-producer")
    public void send(AccountOperationCommand command) {
        try {
            CompletableFuture<SendResult<String, AccountOperationCommand>> future =
                    kafkaTemplate.send(accountOperationCommandsTopic, buildMessageKey(command), command);

            SendResult<String, AccountOperationCommand> result = future.get(5, TimeUnit.SECONDS);

            log.debug("Command {} sent to partition {} with offset {}",
                    command.commandId(),
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset()
            );

        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new InternalServerErrorException("Failed to enqueue account operation.");
        } catch (Exception exception) {
            throw new InternalServerErrorException("Failed to enqueue account operation.");
        }
    }

    private void sendFallback(AccountOperationCommand command, Exception ex) {
        log.error("Circuit breaker fallback for command {}: {}", command.commandId(), ex.getMessage());
        throw new InternalServerErrorException("Service temporarily unavailable, please try again later");
    }

    private String buildMessageKey(AccountOperationCommand command) {
        if (command.accountId() != null) {
            return command.accountId().toString();
        }
        return command.commandId().toString();
    }
}
