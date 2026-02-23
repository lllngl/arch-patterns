package com.internetbank.common.dtos;


import com.internetbank.common.enums.RoleName;

import java.time.LocalDate;
import java.util.UUID;

public record UserDTO(
        UUID id,
        String firstName,
        String lastName,
        String patronymic,
        String email,
        Long phone,
        String gender,
        RoleName role,
        boolean isBlocked,
        LocalDate birthDate
) {}

