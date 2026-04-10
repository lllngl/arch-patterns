package com.internetbank.common.clients.fallback;

import com.internetbank.common.clients.UserAppClient;
import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.exceptions.InternalServerErrorException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
public class UserAppClientFallback implements UserAppClient {

    @Override
    public UserDTO getUserById(UUID userId) {
        log.error("Fallback: User service unavailable for user {}", userId);
        throw new InternalServerErrorException("User service temporarily unavailable, please try again later");
    }
}