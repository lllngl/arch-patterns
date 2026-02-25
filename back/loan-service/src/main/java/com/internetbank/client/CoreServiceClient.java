package com.internetbank.client;

import com.internetbank.client.fallback.CoreServiceFallback;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.dtos.AccountTransactionDTO;
import com.internetbank.dto.request.TransactionRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@FeignClient(
        name = "core-service",
        url = "${services.core-service.url}",
        fallback = CoreServiceFallback.class
)
public interface CoreServiceClient {

    @GetMapping("/api/accounts/{accountId}")
    ResponseEntity<AccountDTO> getAccount(@PathVariable("accountId") UUID accountId);

    @GetMapping("/api/accounts/user/{userId}")
    ResponseEntity<List<AccountDTO>> getAccountsByUser(@PathVariable("userId") UUID userId);

    @GetMapping("/api/accounts/{accountId}/balance")
    ResponseEntity<BigDecimal> getAccountBalance(@PathVariable("accountId") UUID accountId);

    @PostMapping("/api/accounts/{accountId}/transactions")
    ResponseEntity<AccountTransactionDTO> createTransaction(
            @PathVariable("accountId") UUID accountId,
            @RequestBody TransactionRequest request);

    @GetMapping("/api/accounts/{accountId}/transactions")
    ResponseEntity<List<AccountTransactionDTO>> getAccountTransactions(@PathVariable("accountId") UUID accountId);

    @PutMapping("/api/accounts/{accountId}/block")
    ResponseEntity<Void> blockAccount(@PathVariable("accountId") UUID accountId);

    @PutMapping("/api/accounts/{accountId}/unblock")
    ResponseEntity<Void> unblockAccount(@PathVariable("accountId") UUID accountId);
}