package com.internetbank.account_service.configs;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "exchange-rate")
public class ExchangeRateProperties {

    private String baseUrl = "https://api.frankfurter.dev/v1";
}
