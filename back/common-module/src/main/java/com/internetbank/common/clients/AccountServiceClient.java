package com.internetbank.common.clients;

import com.internetbank.common.clients.fallback.AccountServiceFallback;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.dtos.MoneyOperationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@FeignClient(
        name = "account-service",
        url = "http://localhost:9005",
        fallback = AccountServiceFallback.class
)
public interface AccountServiceClient {

    @GetMapping("/api/v1/accounts/{accountId}/internal")
    ResponseEntity<AccountDTO> getAccount(@PathVariable("accountId") UUID accountId, @RequestParam("userId") UUID userId);

    @PatchMapping("/api/v1/accounts/{accountId}/internal/withdraw")
    ResponseEntity<AccountDTO> withdraw(@PathVariable("accountId") UUID accountId,
                                        @RequestBody MoneyOperationRequest request,
                                        @RequestParam("userId") UUID userId);

    @PatchMapping("/api/v1/accounts/{accountId}/internal/deposit")
    ResponseEntity<AccountDTO> deposit(@PathVariable("accountId") UUID accountId,
                                               @RequestBody MoneyOperationRequest request,
                                               @RequestParam("userId") UUID userId);
}