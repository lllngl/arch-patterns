package com.internetbank.account_service.messaging;

import com.internetbank.account_service.enums.AccountType;
import com.internetbank.account_service.models.Account;
import com.internetbank.account_service.repositories.AccountRepository;
import com.internetbank.account_service.services.FirebasePushSender;
import com.internetbank.common.clients.UserPreferencesClient;
import com.internetbank.common.dtos.PushTokenLookupRequest;
import com.internetbank.common.dtos.PushTokenRecordResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AccountTransactionsInvalidationNotifier {

    private final SimpMessagingTemplate messagingTemplate;
    private final AccountRepository accountRepository;
    private final UserPreferencesClient userPreferencesClient;
    private final FirebasePushSender firebasePushSender;

    @Value("${app.websocket.account-transactions-destination-prefix}")
    private String destinationPrefix;

    @Value("${app.websocket.employee-operations-destination}")
    private String employeeOperationsDestination;

    @Value("${app.firebase.employee-operations-topic}")
    private String employeeOperationsTopic;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTransactionsChanged(AccountTransactionsInvalidationEvent event) {
        List<Account> affectedAccounts = accountRepository.findAllById(event.accountIds());
        EmployeeOperationNotificationPayload employeePayload = EmployeeOperationNotificationPayload.created(
                event,
                resolveCustomerIds(affectedAccounts)
        );

        for (java.util.UUID accountId : event.accountIds()) {
            AccountTransactionsInvalidationPayload payload = AccountTransactionsInvalidationPayload.created(
                    event.commandId(),
                    accountId,
                    event.emittedAt()
            );
            messagingTemplate.convertAndSend(
                    destinationPrefix + "/" + accountId + "/transactions",
                    payload
            );
            sendAccountScopedPush(accountId, payload, affectedAccounts);
        }

        messagingTemplate.convertAndSend(
                employeeOperationsDestination,
                employeePayload
        );
        firebasePushSender.sendToTopic(employeeOperationsTopic, employeePayload.eventType(), employeePayload);
    }

    private void sendAccountScopedPush(UUID accountId,
                                       AccountTransactionsInvalidationPayload payload,
                                       List<Account> affectedAccounts) {
        if (!firebasePushSender.isEnabled()) {
            return;
        }

        Set<UUID> customerIds = affectedAccounts.stream()
                .filter(account -> accountId.equals(account.getId()))
                .filter(account -> account.getType() == AccountType.CUSTOMER)
                .map(Account::getUserId)
                .collect(Collectors.toSet());

        if (customerIds.isEmpty()) {
            return;
        }

        Map<UUID, List<String>> tokensByUserId = userPreferencesClient.getPushTokens(new PushTokenLookupRequest(customerIds)).stream()
                .collect(Collectors.groupingBy(
                        PushTokenRecordResponse::userId,
                        Collectors.mapping(PushTokenRecordResponse::pushToken, Collectors.toList())
                ));

        customerIds.stream()
                .map(tokensByUserId::get)
                .filter(tokens -> tokens != null && !tokens.isEmpty())
                .forEach(tokens -> firebasePushSender.sendToTokens(tokens, payload.eventType(), payload));
    }

    private Set<UUID> resolveCustomerIds(List<Account> affectedAccounts) {
        return affectedAccounts.stream()
                .filter(account -> account.getType() == AccountType.CUSTOMER)
                .map(Account::getUserId)
                .collect(Collectors.toSet());
    }
}
