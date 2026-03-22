package com.internetbank.common.service;

import com.internetbank.common.enums.CurrencyCode;

import java.math.BigDecimal;

public interface ExchangeRateService {

    BigDecimal getRate(CurrencyCode fromCurrency, CurrencyCode toCurrency);

    ConversionResult convert(BigDecimal amount, CurrencyCode fromCurrency, CurrencyCode toCurrency);

    record ConversionResult(BigDecimal convertedAmount, BigDecimal rate) {
    }
}
