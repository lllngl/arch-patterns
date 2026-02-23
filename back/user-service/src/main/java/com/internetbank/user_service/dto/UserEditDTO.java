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
    private String firstName;

    @Size(min = 1, max = 85, message = "LastName must be between 1 and 85 characters.")
    private String lastName;

    @Size(max = 85, message = "Patronymic must be less than 85 characters.")
    private String patronymic;

    @Positive(message = "Phone number must be a positive number.")
    @Digits(integer = 15, fraction = 0, message = "Phone number can only contain digits and must not exceed 15 digits.")
    private Long phone;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Size(min = 5, max = 30, message = "Email must be between 5 and 30 characters.")
    @Email(message = "Invalid email format.")
    private String email;

    @Past(message = "Birth date must be in the past.")
    private LocalDate birthDate;
}