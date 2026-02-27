package com.internetbank.config;

import com.internetbank.common.config.BaseOpenApiConfig;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LoanApiConfig extends BaseOpenApiConfig {
    @Override
    protected String getApiTitle() {
        return "Loan Api";
    }
}