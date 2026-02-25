package com.internetbank.client;

import com.internetbank.client.fallback.UserServiceFallback;
import com.internetbank.common.dtos.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

@FeignClient(
        name = "user-service",
        url = "${services.user-service.url}",
        fallback = UserServiceFallback.class
)
public interface UserServiceClient {

    @GetMapping("/api/users/{userId}")
    ResponseEntity<UserDTO> getUser(@PathVariable("userId") UUID userId);

    @GetMapping("/api/users/by-email")
    ResponseEntity<UserDTO> getUserByEmail(@RequestParam("email") String email);

    @GetMapping("/api/users")
    ResponseEntity<List<UserDTO>> getAllUsers();

    @GetMapping("/api/users/{userId}/exists")
    ResponseEntity<Boolean> userExists(@PathVariable("userId") UUID userId);

    @GetMapping("/api/users/{userId}/role")
    ResponseEntity<String> getUserRole(@PathVariable("userId") UUID userId);

    @PutMapping("/api/users/{userId}/block")
    ResponseEntity<Void> blockUser(@PathVariable("userId") UUID userId);

    @PutMapping("/api/users/{userId}/unblock")
    ResponseEntity<Void> unblockUser(@PathVariable("userId") UUID userId);
}