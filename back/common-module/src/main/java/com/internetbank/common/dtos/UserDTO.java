package com.internetbank.common.dtos;


import com.internetbank.common.enums.RoleName;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

public record UserDTO(
        UUID id,
        String keycloakUserId,
        String firstName,
        String lastName,
        String patronymic,
        String email,
        Long phone,
        String gender,
        Set<RoleName> roles,
        boolean isBlocked,
        LocalDate birthDate
) {
    public boolean hasRole(RoleName roleName) {
        return roleName != null && roles != null && roles.contains(roleName);
    }
}

