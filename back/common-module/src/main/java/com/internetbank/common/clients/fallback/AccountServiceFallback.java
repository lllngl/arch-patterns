package com.internetbank.common.clients.fallback;

import com.internetbank.common.clients.AccountServiceClient;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.dtos.MoneyOperationRequest;
import com.internetbank.common.dtos.OperationAcceptedResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
public class AccountServiceFallback implements FallbackFactory<AccountServiceClient> {

    @Override
    public AccountServiceClient create(Throwable cause) {
        log.error("Core service is unavailable: {}", cause.getMessage());

        return new AccountServiceClient() {
            @Override
            public ResponseEntity<AccountDTO> getAccount(UUID accountId, UUID userId) {
                log.warn("Fallback: getAccount({}) - service unavailable", accountId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            @Override
            public ResponseEntity<OperationAcceptedResponse> withdraw(UUID accountId, MoneyOperationRequest request, UUID user) {
                log.warn("Fallback: withdraw(accountId: {}) - service unavailable", accountId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            @Override
            public ResponseEntity<OperationAcceptedResponse> deposit(UUID accountId, MoneyOperationRequest request, UUID user) {
                log.warn("Fallback: deposit(accountId: {}) - service unavailable", accountId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }
        };
    }
}