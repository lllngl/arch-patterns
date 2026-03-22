package com.internetbank.account_service.configs;

import com.internetbank.common.enums.CurrencyCode;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "bank")
public class BankProperties {

    private CurrencyCode baseCurrency = CurrencyCode.RUB;
    private List<CurrencyCode> supportedCurrencies = new ArrayList<>(List.of(CurrencyCode.RUB, CurrencyCode.USD, CurrencyCode.EUR));
    private UUID masterAccountUserId = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private String masterAccountName = "Bank master account";
    private BigDecimal commissionPercent = BigDecimal.ZERO;

    @PostConstruct
    void validate() {
        if (!supportedCurrencies.contains(baseCurrency)) {
            supportedCurrencies.add(baseCurrency);
        }
        if (commissionPercent == null || commissionPercent.signum() < 0) {
            commissionPercent = BigDecimal.ZERO;
        }
    }
}
