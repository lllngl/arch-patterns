package com.internetbank.account_service.messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class AccountTransactionsInvalidationNotifier {

    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.websocket.account-transactions-destination-prefix}")
    private String destinationPrefix;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTransactionsChanged(AccountTransactionsInvalidationEvent event) {
        for (java.util.UUID accountId : event.accountIds()) {
            messagingTemplate.convertAndSend(
                    destinationPrefix + "/" + accountId + "/transactions",
                    AccountTransactionsInvalidationPayload.created(event.commandId(), accountId, event.emittedAt())
            );
        }
    }
}
