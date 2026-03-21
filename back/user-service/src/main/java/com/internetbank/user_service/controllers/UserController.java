package com.internetbank.user_service.controllers;

import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.dtos.page.PageRequestParams;
import com.internetbank.common.enums.RoleName;
import com.internetbank.common.parameters.PageableUtils;
import com.internetbank.common.security.AuthenticatedUser;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
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
            @RequestParam("roles") Set<RoleName> roleNames,
            @Valid @RequestBody UserRegisterDTO request) {
        return ResponseEntity.status(201).body(userService.createUserByEmployee(request, roleNames));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("@internalSecurity.hasInternalAccess() or hasRole('EMPLOYEE') or #userId == principal.id")
    public ResponseEntity<UserDTO> getUserById(
            @PathVariable("userId") @P("userId") UUID userId) {
        return ResponseEntity.ok(userService.getProfileById(userId));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getMyProfile(
            @AuthenticationPrincipal AuthenticatedUser connectedUser) {
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
    @PreAuthorize("hasRole('EMPLOYEE') and #userId != principal.id")
    public ResponseEntity<?> deleteUserById(
            @PathVariable("userId") UUID userId) {
        userService.deleteUserById(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/roles/{roleName}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<UserDTO> addRoleToUser(
            @PathVariable("userId") UUID userId,
            @PathVariable("roleName") RoleName roleName) {
        return ResponseEntity.ok(userService.addRoleToUser(userId, roleName));
    }

    @DeleteMapping("/{userId}/roles/{roleName}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<UserDTO> removeRoleFromUser(
            @PathVariable("userId") UUID userId,
            @PathVariable("roleName") RoleName roleName) {
        return ResponseEntity.ok(userService.removeRoleFromUser(userId, roleName));
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
    @PreAuthorize("hasRole('EMPLOYEE') and #userId != principal.id")
    public ResponseEntity<?> blockProfileById(
            @PathVariable("userId") @P("userId") UUID userId) {
        userService.blockProfileById(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{userId}/unblock")
    @PreAuthorize("hasRole('EMPLOYEE') and #userId != principal.id")
    public ResponseEntity<?> unblockProfileById(
            @PathVariable("userId") @P("userId") UUID userId) {
        userService.unblockProfileById(userId);
        return ResponseEntity.ok().build();
    }

}