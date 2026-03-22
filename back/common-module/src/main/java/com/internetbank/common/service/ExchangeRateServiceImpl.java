package com.internetbank.common.service;

import com.internetbank.common.clients.ExchangeRateClient;
import com.internetbank.common.enums.CurrencyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class ExchangeRateServiceImpl implements ExchangeRateService {

    private static final int MONEY_SCALE = 2;

    private final ExchangeRateClient exchangeRateClient;

    @Override
    public BigDecimal getRate(CurrencyCode fromCurrency, CurrencyCode toCurrency) {
        return exchangeRateClient.getRate(fromCurrency, toCurrency);
    }

    @Override
    public ConversionResult convert(BigDecimal amount, CurrencyCode fromCurrency, CurrencyCode toCurrency) {
        BigDecimal rate = getRate(fromCurrency, toCurrency);
        BigDecimal convertedAmount = amount.multiply(rate).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        return new ConversionResult(convertedAmount, rate);
    }
}
