package com.internetbank.account_service.dtos;

import jakarta.validation.constraints.Size;

public record AccountCreateRequest(
        @Size(max = 100, message = "Account name must be less than 100 characters")
        String name
) {
}



