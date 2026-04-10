package com.internetbank.common.clients;

import com.internetbank.common.clients.fallback.UserAppClientFallback;
import com.internetbank.common.dtos.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(
        name = "user-service",
        url = "http://localhost:9000",
        configuration = SecurityFeignClientConfig.class,
        fallback = UserAppClientFallback.class
)
public interface UserAppClient {

    @GetMapping("api/v1/users/{userId}")
    UserDTO getUserById(@PathVariable("userId") UUID userId);
}
