package com.internetbank.account_service.integration;

import com.internetbank.account_service.configs.ExchangeRateProperties;
import com.internetbank.common.enums.CurrencyCode;
import com.internetbank.common.exceptions.InternalServerErrorException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class ExchangeRateClient {

    private final RestClient restClient;

    public ExchangeRateClient(RestClient.Builder restClientBuilder, ExchangeRateProperties properties) {
        this.restClient = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    public BigDecimal getRate(CurrencyCode baseCurrency, CurrencyCode targetCurrency) {
        if (baseCurrency == targetCurrency) {
            return BigDecimal.ONE;
        }

        ExchangeRateResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/latest")
                        .queryParam("base", baseCurrency.name())
                        .queryParam("symbols", targetCurrency.name())
                        .build())
                .retrieve()
                .body(ExchangeRateResponse.class);

        if (response == null || response.rates() == null || response.rates().get(targetCurrency.name()) == null) {
            throw new InternalServerErrorException(
                    "Failed to obtain exchange rate for %s/%s".formatted(baseCurrency, targetCurrency));
        }

        return response.rates().get(targetCurrency.name());
    }

    private record ExchangeRateResponse(
            String base,
            String date,
            Map<String, BigDecimal> rates
    ) {
    }
}
