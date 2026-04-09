package com.internetbank.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.telemetry")
public class TelemetryProperties {

    private boolean enabled = true;
    private boolean exportEnabled = true;
    private String monitoringBaseUrl = "http://localhost:9015";
}
