package com.internetbank.common.clients.fallback;

import com.internetbank.common.clients.UserPreferencesClient;
import com.internetbank.common.dtos.PushTokenLookupRequest;
import com.internetbank.common.dtos.PushTokenRecordResponse;
import com.internetbank.common.exceptions.InternalServerErrorException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class UserPreferencesClientFallback implements UserPreferencesClient {

    @Override
    public List<PushTokenRecordResponse> getPushTokens(PushTokenLookupRequest request) {
        log.error("Fallback: user-preferences-service unavailable for push token lookup");
        throw new InternalServerErrorException("User preferences service temporarily unavailable, please try again later");
    }
}
