package com.internetbank.user_service.services.impl;

import com.internetbank.common.dtos.auth.ChangePasswordRequest;
import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.enums.RoleName;
import com.internetbank.common.parameters.SpecificationFilter;
import com.internetbank.user_service.dto.UserEditDTO;
import com.internetbank.user_service.dto.UserRegisterDTO;
import com.internetbank.user_service.enums.Gender;
import com.internetbank.user_service.mappers.UserMapper;
import com.internetbank.user_service.models.Role;
import com.internetbank.user_service.models.User;
import com.internetbank.user_service.repositories.RoleRepository;
import com.internetbank.user_service.repositories.UserRepository;
import com.internetbank.user_service.services.TokenService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final TokenService tokenService;
    private final SpecificationFilter specificationFilter;

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request, Principal connectedUser) {
        if (!(connectedUser instanceof UsernamePasswordAuthenticationToken)) {
            throw new UnauthorizedException("User must be authenticated to change password.");
        }

        UserDTO userDTO = (UserDTO) ((UsernamePasswordAuthenticationToken) connectedUser).getPrincipal();
        User user = userRepository.findById(userDTO.id())
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userDTO.id()));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match.");
        }
        if (!request.newPassword().equals(request.confirmationPassword())) {
            throw new BadRequestException("New password and confirmation password do not match.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        revokeAllUserSessionsByUserId(user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO getMyProfile(Principal connectedUser) {
        if (!(connectedUser instanceof UsernamePasswordAuthenticationToken)) {
            throw new UnauthorizedException("User is not authenticated.");
        }
        UserDTO userDTO = (UserDTO) ((UsernamePasswordAuthenticationToken) connectedUser).getPrincipal();
        User user = userRepository.findById(userDTO.id())
                .orElseThrow(() -> new NotFoundException("Authenticated user profile not found."));
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

        boolean isChangeEmail = userEditDTO.getEmail() != null && !existingUser.getEmail().equalsIgnoreCase(userEditDTO.getEmail());
        if (isChangeEmail) {
            userRepository.findByEmail(userEditDTO.getEmail())
                    .ifPresent(u -> {
                        if (!u.getId().equals(userId)) {
                            throw new DuplicateResourceException("Email '" + userEditDTO.getEmail() + "' is already in use by another user.");
                        }
                    });
        }

        userMapper.updateUserFromDto(userEditDTO, existingUser);
        User updatedUser = userRepository.saveAndFlush(existingUser);
        if (isChangeEmail) revokeAllUserSessionsByUserId(userId);
        return userMapper.userToUserDto(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUserById(UUID userId) {
        User userToDelete = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));

        tokenService.invalidateAllUserSessions(userId);

        userRepository.delete(userToDelete);
        revokeAllUserSessionsByUserId(userId);
    }

    @Override
    @Transactional
    public void revokeAllUserSessionsByUserId(UUID userId) {
        tokenService.invalidateAllUserSessions(userId);
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
        userRepository.save(user);
        revokeAllUserSessionsByUserId(userId);
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
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void addRoleToUser(UUID userId, RoleName roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));

        Role role = roleRepository.findByRolename(roleName)
                .orElseThrow(() -> new NotFoundException("Role '" + roleName + "' not found."));

        if (role.equals(user.getRole())) {
            return;
        }

        user.setRole(role);
        userRepository.save(user);
        revokeAllUserSessionsByUserId(userId);
    }

    @Override
    @Transactional
    public void removeRoleFromUser(UUID userId, RoleName roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + userId));

        Role roleToRemove = roleRepository.findByRolename(roleName)
                .orElseThrow(() -> new NotFoundException("Role '" + roleName + "' not found."));

        if (!roleToRemove.equals(user.getRole())) {
            return;
        }

        user.setRole(null);
        userRepository.save(user);
        revokeAllUserSessionsByUserId(userId);
    }

    @Override
    @Transactional
    public UserDTO createUserByEmployee(UserRegisterDTO userRegisterDTO, RoleName roleName) {
        if (roleName == null) {
            throw new BadRequestException("Role is required.");
        }
        return createUserWithRole(userRegisterDTO, roleName);
    }

    private UserDTO createUserWithRole(UserRegisterDTO userRegisterDTO, RoleName roleName) {
        if (userRepository.findByEmail(userRegisterDTO.getEmail()).isPresent()) {
            throw new DuplicateResourceException("User with email '" + userRegisterDTO.getEmail() + "' already exists.");
        }

        if (userRepository.findByPhone(userRegisterDTO.getPhone()).isPresent()) {
            throw new DuplicateResourceException("User with phone '" + userRegisterDTO.getPhone() + "' already exists.");
        }

        User user = userMapper.userRegisterDtoToUser(userRegisterDTO);
        Role role = roleRepository.findByRolename(roleName)
                .orElseThrow(() -> new NotFoundException("Role '" + roleName + "' not found."));
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return userMapper.userToUserDto(userRepository.saveAndFlush(user));
    }
}
