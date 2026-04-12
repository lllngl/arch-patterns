package com.internetbank.account_service.configs;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.firebase")
public class FirebasePushProperties {

    private boolean enabled = false;
    private String credentialsPath;
    private String employeeOperationsTopic = "employee-operations";
}
