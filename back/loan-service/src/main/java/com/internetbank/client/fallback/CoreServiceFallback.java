package com.internetbank.client.fallback;

import com.internetbank.client.CoreServiceClient;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.dtos.AccountTransactionDTO;
import com.internetbank.dto.request.TransactionRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class CoreServiceFallback implements FallbackFactory<CoreServiceClient> {

    @Override
    public CoreServiceClient create(Throwable cause) {
        log.error("Core service is unavailable: {}", cause.getMessage());

        return new CoreServiceClient() {
            @Override
            public ResponseEntity<AccountDTO> getAccount(UUID accountId) {
                log.warn("Fallback: getAccount({}) - service unavailable", accountId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            @Override
            public ResponseEntity<List<AccountDTO>> getAccountsByUser(UUID userId) {
                log.warn("Fallback: getAccountsByUser({}) - service unavailable", userId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Collections.emptyList());
            }

            @Override
            public ResponseEntity<BigDecimal> getAccountBalance(UUID accountId) {
                log.warn("Fallback: getAccountBalance({}) - service unavailable", accountId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            @Override
            public ResponseEntity<AccountTransactionDTO> createTransaction(UUID accountId, TransactionRequest request) {
                log.warn("Fallback: createTransaction({}) - service unavailable", accountId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            @Override
            public ResponseEntity<List<AccountTransactionDTO>> getAccountTransactions(UUID accountId) {
                log.warn("Fallback: getAccountTransactions({}) - service unavailable", accountId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Collections.emptyList());
            }

            @Override
            public ResponseEntity<Void> blockAccount(UUID accountId) {
                log.warn("Fallback: blockAccount({}) - service unavailable", accountId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }

            @Override
            public ResponseEntity<Void> unblockAccount(UUID accountId) {
                log.warn("Fallback: unblockAccount({}) - service unavailable", accountId);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
            }
        };
    }
}