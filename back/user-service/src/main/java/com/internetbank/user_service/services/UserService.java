package com.internetbank.user_service.services;

import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.enums.RoleName;
import com.internetbank.common.security.AuthenticatedUser;
import com.internetbank.user_service.dto.UserEditDTO;
import com.internetbank.user_service.dto.UserRegisterDTO;
import com.internetbank.user_service.enums.Gender;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Set;
import java.util.UUID;

public interface UserService {
    UserDTO getMyProfile(AuthenticatedUser connectedUser);

    UserDTO getProfileById(UUID userId);
    UserDTO updateProfileById(UserEditDTO userEditDTO, UUID userId);
    void deleteUserById (UUID userId);

    Page<UserDTO> getAllUsers(Pageable pageable, String username, String email, Gender gender, Boolean isBlocked);
    void blockProfileById(UUID userId);
    void unblockProfileById(UUID userId);
    UserDTO addRoleToUser(UUID userId, RoleName roleName);
    UserDTO removeRoleFromUser(UUID userId, RoleName roleName);
    UserDTO createUserByEmployee(UserRegisterDTO userRegisterDTO, Set<RoleName> roleNames);
}
