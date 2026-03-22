package com.internetbank.user_service.dto;

import com.internetbank.user_service.enums.Gender;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserEditDTO {

    @Size(min = 1, max = 85, message = "FirstName must be between 1 and 85 characters.")
    @NotBlank(message = "FirstName is required.")
    private String firstName;

    @Size(min = 1, max = 85, message = "LastName must be between 1 and 85 characters.")
    @NotBlank(message = "LastName is required.")
    private String lastName;

    @Size(max = 85, message = "Patronymic must be less than 85 characters.")
    private String patronymic;

    @Positive(message = "Phone number must be a positive number.")
    @NotNull(message = "Phone number is required.")
    @Digits(integer = 15, fraction = 0, message = "Phone number can only contain digits and must not exceed 15 digits.")
    private Long phone;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Gender is required.")
    private Gender gender;

    @Past(message = "Birth date must be in the past.")
    @NotNull(message = "Birth date is required.")
    private LocalDate birthDate;
}