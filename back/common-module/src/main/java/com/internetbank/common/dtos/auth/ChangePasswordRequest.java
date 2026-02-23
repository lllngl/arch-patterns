package com.internetbank.common.dtos.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;


public record ChangePasswordRequest(

        @NotBlank(message = "User password cannot be empty")
        @Size(min = 6, message = "Password must be at least 6 characters long")
        @Schema(example = "string1")
        @Pattern(regexp = ".*\\d.*", message = "Password must contain at least one digit")
        String currentPassword,

        @NotBlank(message = "User password cannot be empty")
        @Size(min = 6, message = "Password must be at least 6 characters long")
        @Schema(example = "string1")
        @Pattern(regexp = ".*\\d.*", message = "Password must contain at least one digit")
        String newPassword,

        @NotBlank(message = "User password cannot be empty")
        @Schema(example = "string1")
        @Size(min = 6, message = "Password must be at least 6 characters long")
        @Pattern(regexp = ".*\\d.*", message = "Password must contain at least one digit")
        String confirmationPassword

) {
}
