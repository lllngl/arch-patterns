package com.internetbank.account_service.configs;

import com.internetbank.common.config.BaseOpenApiConfig;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AccountApiConfig extends BaseOpenApiConfig {
    @Override
    protected String getApiTitle() {
        return "Account Api";
    }
}



