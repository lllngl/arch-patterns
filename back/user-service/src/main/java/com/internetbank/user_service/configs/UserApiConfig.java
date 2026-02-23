package com.internetbank.user_service.configs;

import com.internetbank.common.config.BaseOpenApiConfig;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UserApiConfig extends BaseOpenApiConfig {
    @Override
    protected String getApiTitle() {
        return "User Api";
    }
}

