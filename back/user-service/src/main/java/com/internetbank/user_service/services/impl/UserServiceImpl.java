package com.internetbank.user_service.services.impl;

import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.enums.RoleName;
import com.internetbank.common.parameters.SpecificationFilter;
import com.internetbank.common.security.AuthenticatedUser;
import com.internetbank.user_service.dto.UserEditDTO;
import com.internetbank.user_service.dto.UserRegisterDTO;
import com.internetbank.user_service.enums.Gender;
import com.internetbank.user_service.integration.keycloak.KeycloakAdminService;
import com.internetbank.user_service.mappers.UserMapper;
import com.internetbank.user_service.models.Role;
import com.internetbank.user_service.models.User;
import com.internetbank.user_service.repositories.RoleRepository;
import com.internetbank.user_service.repositories.UserRepository;
import com.internetbank.user_service.services.UserService;
import com.internetbank.common.exceptions.BadRequestException;
import com.internetbank.common.exceptions.DuplicateResourceException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.common.exceptions.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final SpecificationFilter specificationFilter;
    private final KeycloakAdminService keycloakAdminService;

    @Override
    @Transactional
    public UserDTO getMyProfile(AuthenticatedUser connectedUser) {
        User user = resolveAuthenticatedUser(connectedUser);
        return userMapper.userToUserDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO getProfileById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));
        return userMapper.userToUserDto(user);
    }

    @Override
    @Transactional
    public UserDTO updateProfileById(UserEditDTO userEditDTO, UUID userId) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));

        boolean isChangePhone = userEditDTO.getPhone() != null && !userEditDTO.getPhone().equals(existingUser.getPhone());

        if (isChangePhone) {
            userRepository.findByPhone(userEditDTO.getPhone())
                    .ifPresent(u -> {
                        if (!u.getId().equals(userId)) {
                            throw new DuplicateResourceException("Phone '" + userEditDTO.getPhone() + "' is already in use by another user.");
                        }
                    });
        }

        userMapper.updateUserFromDto(userEditDTO, existingUser);
        User updatedUser = userRepository.saveAndFlush(existingUser);
        keycloakAdminService.syncUser(updatedUser);
        return userMapper.userToUserDto(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUserById(UUID userId) {
        User userToDelete = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));
        keycloakAdminService.deleteUser(userToDelete.getKeycloakUserId());
        userRepository.delete(userToDelete);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDTO> getAllUsers(Pageable pageable, String username, String email, Gender gender, Boolean isBlocked) {
        Map<String, Object> filters = new LinkedHashMap<>();
        filters.put("email", email);
        filters.put("gender", gender);
        filters.put("isBlocked", isBlocked);

        Specification<User> spec = specificationFilter.applyFilters(filters);

        if (username != null && !username.isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("firstName")), "%" + username.toLowerCase() + "%"),
                            cb.like(cb.lower(root.get("lastName")), "%" + username.toLowerCase() + "%"),
                            cb.like(cb.lower(root.get("patronymic")), "%" + username.toLowerCase() + "%")
                    ));
        }

        Page<User> usersPage = userRepository.findAll(spec, pageable);
        return usersPage.map(userMapper::userToUserDto);
    }

    @Override
    @Transactional
    public void blockProfileById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));
        if (user.isBlocked()) {
            return;
        }
        user.setBlocked(true);
        userRepository.saveAndFlush(user);
        keycloakAdminService.syncUser(user);
    }

    @Override
    @Transactional
    public void unblockProfileById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));

        if (!user.isBlocked()) {
            return;
        }

        user.setBlocked(false);
        userRepository.saveAndFlush(user);
        keycloakAdminService.syncUser(user);
    }

    @Override
    @Transactional
    public UserDTO addRoleToUser(UUID userId, RoleName roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));

        Role role = roleRepository.findByRolename(roleName)
                .orElseThrow(() -> new NotFoundException("Role '" + roleName + "' not found."));

        if (user.getRoles().contains(role)) {
            return userMapper.userToUserDto(user);
        }

        user.getRoles().add(role);
        User updatedUser = userRepository.saveAndFlush(user);
        keycloakAdminService.syncUser(updatedUser);
        return userMapper.userToUserDto(updatedUser);
    }

    @Override
    @Transactional
    public UserDTO removeRoleFromUser(UUID userId, RoleName roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));

        Role roleToRemove = roleRepository.findByRolename(roleName)
                .orElseThrow(() -> new NotFoundException("Role '" + roleName + "' not found."));

        if (!user.getRoles().contains(roleToRemove)) {
            return userMapper.userToUserDto(user);
        }

        if (user.getRoles().size() == 1) {
            throw new BadRequestException("User must keep at least one role.");
        }

        user.getRoles().remove(roleToRemove);
        User updatedUser = userRepository.saveAndFlush(user);
        keycloakAdminService.syncUser(updatedUser);
        return userMapper.userToUserDto(updatedUser);
    }

    @Override
    @Transactional
    public UserDTO createUserByEmployee(UserRegisterDTO userRegisterDTO, Set<RoleName> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            throw new BadRequestException("At least one role is required.");
        }
        return createUserWithRoles(userRegisterDTO, roleNames);
    }

    private UserDTO createUserWithRoles(UserRegisterDTO userRegisterDTO, Set<RoleName> roleNames) {
        if (userRepository.findByEmail(userRegisterDTO.getEmail()).isPresent()) {
            throw new DuplicateResourceException("User with email '" + userRegisterDTO.getEmail() + "' already exists.");
        }

        if (userRepository.findByPhone(userRegisterDTO.getPhone()).isPresent()) {
            throw new DuplicateResourceException("User with phone '" + userRegisterDTO.getPhone() + "' already exists.");
        }

        User user = userMapper.userRegisterDtoToUser(userRegisterDTO);
        user.setRoles(loadRoles(roleNames));

        User persistedUser = userRepository.saveAndFlush(user);
        try {
            persistedUser.setKeycloakUserId(keycloakAdminService.createUser(persistedUser));
            persistedUser = userRepository.saveAndFlush(persistedUser);
        } catch (RuntimeException ex) {
            userRepository.delete(persistedUser);
            throw ex;
        }

        return userMapper.userToUserDto(persistedUser);
    }

    private Set<Role> loadRoles(Set<RoleName> roleNames) {
        Set<Role> roles = new HashSet<>();
        for (RoleName roleName : roleNames) {
            if (roleName == null) {
                continue;
            }
            Role role = roleRepository.findByRolename(roleName)
                    .orElseThrow(() -> new NotFoundException("Role '" + roleName + "' not found."));
            roles.add(role);
        }

        if (roles.isEmpty()) {
            throw new BadRequestException("At least one valid role is required.");
        }

        return roles;
    }

    private User resolveAuthenticatedUser(AuthenticatedUser connectedUser) {
        if (connectedUser == null) {
            throw new UnauthorizedException("User is not authenticated.");
        }

        if (connectedUser.getId() != null) {
            return userRepository.findById(connectedUser.getId())
                    .orElseThrow(() -> new NotFoundException("Authenticated user profile not found."));
        }

        if (connectedUser.getKeycloakUserId() != null && !connectedUser.getKeycloakUserId().isBlank()) {
            return userRepository.findByKeycloakUserId(connectedUser.getKeycloakUserId())
                    .orElseGet(() -> resolveAndLinkUserByEmail(connectedUser));
        }

        if (connectedUser.getEmail() != null && !connectedUser.getEmail().isBlank()) {
            return resolveAndLinkUserByEmail(connectedUser);
        }

        throw new UnauthorizedException("User token is missing the local user identifier.");
    }

    private User resolveAndLinkUserByEmail(AuthenticatedUser connectedUser) {
        User user = userRepository.findByEmail(connectedUser.getEmail())
                .orElseThrow(() -> new NotFoundException("Authenticated user profile not found."));

        String principalKeycloakUserId = connectedUser.getKeycloakUserId();
        if (principalKeycloakUserId == null || principalKeycloakUserId.isBlank()) {
            return user;
        }

        String currentKeycloakUserId = user.getKeycloakUserId();
        if (currentKeycloakUserId != null && !currentKeycloakUserId.isBlank()
                && !currentKeycloakUserId.equals(principalKeycloakUserId)) {
            throw new UnauthorizedException("Authenticated Keycloak account does not match the linked local user.");
        }

        if (principalKeycloakUserId.equals(currentKeycloakUserId)) {
            return user;
        }

        user.setKeycloakUserId(principalKeycloakUserId);
        User linkedUser = userRepository.saveAndFlush(user);
        log.info("Linked local user {} to Keycloak user {} during authenticated request.",
                linkedUser.getEmail(), principalKeycloakUserId);
        return linkedUser;
    }
}
