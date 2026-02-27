package com.internetbank.service.strategy;

import java.math.BigDecimal;

public interface PaymentStrategy {

    BigDecimal calculateMonthlyPayment(BigDecimal principal, BigDecimal annualRate, int termMonths);
}
