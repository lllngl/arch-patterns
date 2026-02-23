package com.internetbank.user_service.controllers;

import com.internetbank.common.dtos.auth.ChangePasswordRequest;
import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.dtos.page.PageRequestParams;
import com.internetbank.common.enums.RoleName;
import com.internetbank.common.parameters.PageableUtils;
import com.internetbank.user_service.dto.UserEditDTO;
import com.internetbank.user_service.dto.UserRegisterDTO;
import com.internetbank.user_service.enums.Gender;
import com.internetbank.user_service.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.method.P;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;
    private final PageableUtils pageableUtils;

    @PostMapping("/create")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<UserDTO> createUser(
            @RequestParam("role") RoleName roleName,
            @Valid @RequestBody UserRegisterDTO request) {
        return ResponseEntity.status(201).body(userService.createUserByEmployee(request, roleName));
    }

    @PatchMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            Principal connectedUser) {
        userService.changePassword(request, connectedUser);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}")
    @PreAuthorize("@internalSecurity.hasInternalAccess() or hasRole('EMPLOYEE') or #userId == principal.id")
    public ResponseEntity<UserDTO> getUserById(
            @PathVariable("userId") @P("userId") UUID userId) {
        return ResponseEntity.ok(userService.getProfileById(userId));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getMyProfile(
            Principal connectedUser) {
        return ResponseEntity.ok(userService.getMyProfile(connectedUser));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('EMPLOYEE') or #userId == principal.id")
    public ResponseEntity<UserDTO> updateProfileById(
            @RequestBody UserEditDTO userEditDTO,
            @PathVariable("userId") @P("userId") UUID userId) {
        return ResponseEntity.ok(userService.updateProfileById(userEditDTO, userId));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<?> deleteUserById(
            @PathVariable("userId") UUID userId) {
        userService.deleteUserById(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/revoke-sessions")
    @PreAuthorize("hasRole('EMPLOYEE') or #userId == principal.id")
    public ResponseEntity<?> revokeAllUserSessions(
            @PathVariable("userId") @P("userId") UUID userId) {
        userService.revokeAllUserSessionsByUserId(userId);
        return ResponseEntity.ok().build();
    }


    @GetMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Page<UserDTO>> getAllUsers(
            @ParameterObject PageRequestParams pageRequestParams,
            @RequestParam(name = "username", required = false) String username,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "gender", required = false) Gender gender,
            @RequestParam(name = "isBlocked", required = false) Boolean isBlocked) {

        Pageable pageable = pageableUtils.of(pageRequestParams);
        Page<UserDTO> users = userService.getAllUsers(pageable, username, email, gender, isBlocked);
        return ResponseEntity.ok(users);

    }

    @PostMapping("/{userId}/block")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<?> blockProfileById(
            @PathVariable("userId") @P("userId") UUID userId) {
        userService.blockProfileById(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{userId}/unblock")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<?> unblockProfileById(
            @PathVariable("userId") @P("userId") UUID userId) {
        userService.unblockProfileById(userId);
        return ResponseEntity.ok().build();
    }

}