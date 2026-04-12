package com.internetbank.common.clients;

import com.internetbank.common.clients.fallback.UserPreferencesClientFallback;
import com.internetbank.common.dtos.PushTokenLookupRequest;
import com.internetbank.common.dtos.PushTokenRecordResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(
        name = "user-preferences-service",
        url = "http://localhost:9010",
        configuration = SecurityFeignClientConfig.class,
        fallback = UserPreferencesClientFallback.class
)
public interface UserPreferencesClient {

    @PostMapping("/api/v1/preferences/internal/push-tokens/query")
    List<PushTokenRecordResponse> getPushTokens(@RequestBody PushTokenLookupRequest request);
}
