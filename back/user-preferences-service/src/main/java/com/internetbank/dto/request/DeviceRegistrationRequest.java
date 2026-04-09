package com.internetbank.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeviceRegistrationRequest {
    @NotBlank(message = "Device ID is required")
    private String deviceId;
}