package com.internetbank.service.strategy;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

@Slf4j
@Component
public class AnnuityPaymentStrategy implements PaymentStrategy {

    private static final MathContext MC = new MathContext(10, RoundingMode.HALF_UP);
    private static final int SCALE = 10;

    @Override
    public BigDecimal calculateMonthlyPayment(BigDecimal principal, BigDecimal annualRate, int termMonths) {

        log.debug("Calculating annuity payment: principal={}, rate={}, months={}", principal, annualRate, termMonths);

        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(12), SCALE, RoundingMode.HALF_UP);

        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(termMonths), 2, RoundingMode.HALF_UP);
        }

        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate, MC);
        BigDecimal pow = onePlusR.pow(termMonths, MC);

        BigDecimal numerator = principal
                .multiply(monthlyRate, MC)
                .multiply(pow, MC);

        BigDecimal denominator = pow.subtract(BigDecimal.ONE, MC);

        BigDecimal monthlyPayment = numerator
                .divide(denominator, 2, RoundingMode.HALF_UP);

        log.debug("Annuity payment calculated: {}", monthlyPayment);

        return monthlyPayment;
    }
}