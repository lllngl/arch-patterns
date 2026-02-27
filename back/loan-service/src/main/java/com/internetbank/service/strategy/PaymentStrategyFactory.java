package com.internetbank.service.strategy;

import com.internetbank.db.model.enums.PaymentType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PaymentStrategyFactory {

    private final AnnuityPaymentStrategy annuityStrategy;

    private Map<PaymentType, PaymentStrategy> getStrategyMap() {
        Map<PaymentType, PaymentStrategy> strategyMap = new EnumMap<>(PaymentType.class);
        strategyMap.put(PaymentType.ANNUITY, annuityStrategy);
        return strategyMap;
    }

    public PaymentStrategy getStrategy(PaymentType paymentType) {
        PaymentStrategy strategy = getStrategyMap().get(paymentType);
        if (strategy == null) throw new IllegalArgumentException("Unsupported payment type: " + paymentType);

        return strategy;
    }
}