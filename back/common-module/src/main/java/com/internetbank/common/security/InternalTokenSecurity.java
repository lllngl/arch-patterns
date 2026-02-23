package com.internetbank.common.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component("internalSecurity")
@Slf4j
public class InternalTokenSecurity {

    @Value("${internal.api.key}")
    private String internalApiKey;

    public boolean hasInternalAccess() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return false;
        }
        String authHeader = attributes.getRequest().getHeader("X-Internal-Request");

        if (authHeader != null) {
            return internalApiKey.equals(authHeader);
        }


        return false;
    }
}
