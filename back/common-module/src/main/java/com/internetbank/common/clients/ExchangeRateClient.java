package com.internetbank.common.clients;

import com.internetbank.common.config.ExchangeRateProperties;
import com.internetbank.common.enums.CurrencyCode;
import com.internetbank.common.exceptions.InternalServerErrorException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

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

        ExchangeRateResponse response;
        try {
            response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .pathSegment(baseCurrency.name())
                            .build())
                    .retrieve()
                    .body(ExchangeRateResponse.class);
        } catch (RestClientResponseException exception) {
            throw new InternalServerErrorException(
                    "Exchange rate provider returned HTTP %s for %s/%s."
                            .formatted(exception.getStatusCode().value(), baseCurrency, targetCurrency)
            );
        } catch (RestClientException exception) {
            throw new InternalServerErrorException(
                    "Failed to call exchange rate provider for %s/%s."
                            .formatted(baseCurrency, targetCurrency)
            );
        }

        if (response == null || response.rates() == null || response.rates().get(targetCurrency.name()) == null) {
            throw new InternalServerErrorException(
                    "Failed to obtain exchange rate for %s/%s".formatted(baseCurrency, targetCurrency));
        }

        return response.rates().get(targetCurrency.name());
    }

    private record ExchangeRateResponse(
            String result,
            String base_code,
            Map<String, BigDecimal> rates
    ) {
    }
}
