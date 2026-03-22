package com.internetbank.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.Set;
import java.util.UUID;

@Data
public class UpdatePreferencesRequest {

    @Pattern(regexp = "LIGHT|DARK", message = "Theme must be LIGHT or DARK")
    private String theme;

    private Set<UUID> hiddenAccountIds;
}