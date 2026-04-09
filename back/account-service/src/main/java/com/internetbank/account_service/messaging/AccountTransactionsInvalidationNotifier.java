package com.internetbank.account_service.messaging;

import com.internetbank.account_service.models.Account;
import com.internetbank.account_service.repositories.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AccountTransactionsInvalidationNotifier {

    private final SimpMessagingTemplate messagingTemplate;
    private final AccountRepository accountRepository;

    @Value("${app.websocket.account-transactions-destination-prefix}")
    private String destinationPrefix;

    @Value("${app.websocket.employee-operations-destination}")
    private String employeeOperationsDestination;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTransactionsChanged(AccountTransactionsInvalidationEvent event) {
        for (java.util.UUID accountId : event.accountIds()) {
            messagingTemplate.convertAndSend(
                    destinationPrefix + "/" + accountId + "/transactions",
                    AccountTransactionsInvalidationPayload.created(event.commandId(), accountId, event.emittedAt())
            );
        }

        Set<UUID> customerIds = accountRepository.findAllById(event.accountIds()).stream()
                .map(Account::getUserId)
                .collect(Collectors.toSet());

        messagingTemplate.convertAndSend(
                employeeOperationsDestination,
                EmployeeOperationNotificationPayload.created(event, customerIds)
        );
    }
}
