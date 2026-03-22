package com.internetbank.account_service.messaging;

import com.internetbank.common.exceptions.InternalServerErrorException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccountOperationProducer {

    private final KafkaTemplate<String, AccountOperationCommand> kafkaTemplate;

    @Value("${app.kafka.topics.account-operation-commands}")
    private String accountOperationCommandsTopic;

    public void send(AccountOperationCommand command) {
        try {
            kafkaTemplate.send(accountOperationCommandsTopic, buildMessageKey(command), command).get();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new InternalServerErrorException("Failed to enqueue account operation.");
        } catch (Exception exception) {
            throw new InternalServerErrorException("Failed to enqueue account operation.");
        }
    }

    private String buildMessageKey(AccountOperationCommand command) {
        if (command.accountId() != null) {
            return command.accountId().toString();
        }
        return command.commandId().toString();
    }
}
