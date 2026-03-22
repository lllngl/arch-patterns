package com.internetbank.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "exchange-rate")
public class ExchangeRateProperties {

    private String baseUrl = "https://open.er-api.com/v6/latest";
}
