package com.internetbank.common.dtos.auth;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;


@Builder
public record AuthRequest(
        @NotBlank(message = "User login cannot be empty")
        @Schema(example = "example@example.com")
        @Size(min = 5, max = 30, message = "Email must be between 5 and 30 characters.")
        @NotBlank(message = "Email is required.")
        @Email(message = "Invalid email format.")
        String login,

        @NotBlank(message = "Password is required.")
        @Size(min = 6, max = 30, message = "Password must be between 8 and 30 characters.")
        @Schema(example = "string1")
        @NotBlank(message = "User password cannot be empty")
        @Pattern(regexp = ".*\\d.*", message = "Password must contain at least one digit")
        String password
) {}

