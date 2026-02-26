package com.internetbank.common.clients;

import com.internetbank.common.clients.fallback.AccountServiceFallback;
import com.internetbank.common.dtos.AccountDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(
        name = "core-service",
        url = "http://localhost:9005",
        fallback = AccountServiceFallback.class
)
public interface AccountServiceClient {

    @GetMapping("/api/v1/accounts/{accountId}/internal")
    ResponseEntity<AccountDTO> getAccount(@PathVariable("accountId") UUID accountId, @RequestParam("userId") UUID userId);
}