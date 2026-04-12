package com.internetbank.controller;

import com.internetbank.common.dtos.PushTokenLookupRequest;
import com.internetbank.common.dtos.PushTokenRecordResponse;
import com.internetbank.common.security.AuthenticatedUser;
import com.internetbank.dto.request.DeviceRegistrationRequest;
import com.internetbank.dto.request.RegisterPushTokenRequest;
import com.internetbank.dto.request.UpdatePreferencesRequest;
import com.internetbank.dto.response.UserPreferencesResponse;
import com.internetbank.service.UserPreferencesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/preferences")
@RequiredArgsConstructor
@Slf4j
public class UserPreferencesController {

    private final UserPreferencesService preferencesService;

    @GetMapping
    public ResponseEntity<UserPreferencesResponse> getPreferences(@AuthenticationPrincipal AuthenticatedUser user,
                                                                  @RequestHeader("X-Device-Id") String deviceId) {

        return ResponseEntity.ok(preferencesService.getPreferences(user.getId(), deviceId));
    }


    @GetMapping("/devices")
    public ResponseEntity<List<UserPreferencesResponse>> getAllDevicesPreferences(@AuthenticationPrincipal AuthenticatedUser user) {

        return ResponseEntity.ok(preferencesService.getAllUserPreferences(user.getId()));
    }


    @PatchMapping
    public ResponseEntity<UserPreferencesResponse> updatePreferences(@AuthenticationPrincipal AuthenticatedUser user,
                                                                     @RequestHeader("X-Device-Id") String deviceId,
                                                                     @Valid @RequestBody UpdatePreferencesRequest request) {

        return ResponseEntity.ok(preferencesService.updatePreferences(user.getId(), deviceId, request));
    }


    @PostMapping("/devices")
    public ResponseEntity<UserPreferencesResponse> registerDevice(@AuthenticationPrincipal AuthenticatedUser user,
                                                                  @Valid @RequestBody DeviceRegistrationRequest request) {

        return ResponseEntity.ok(preferencesService.registerDevice(user.getId(), request));
    }

    @PutMapping("/devices/{deviceId}/push-token")
    public ResponseEntity<UserPreferencesResponse> registerPushToken(@AuthenticationPrincipal AuthenticatedUser user,
                                                                    @PathVariable String deviceId,
                                                                    @Valid @RequestBody RegisterPushTokenRequest request) {

        return ResponseEntity.ok(preferencesService.registerPushToken(user.getId(), deviceId, request));
    }

    @DeleteMapping("/devices/{deviceId}/push-token")
    public ResponseEntity<Void> unregisterPushToken(@AuthenticationPrincipal AuthenticatedUser user,
                                                    @PathVariable String deviceId) {

        preferencesService.unregisterPushToken(user.getId(), deviceId);
        return ResponseEntity.noContent().build();
    }


    @DeleteMapping("/devices/{deviceId}")
    public ResponseEntity<Void> unregisterDevice(@AuthenticationPrincipal AuthenticatedUser user,
                                                 @PathVariable String deviceId) {

        preferencesService.unregisterDevice(user.getId(), deviceId);
        return ResponseEntity.noContent().build();
    }


    @PatchMapping("/theme")
    public ResponseEntity<UserPreferencesResponse> updateTheme(@AuthenticationPrincipal AuthenticatedUser user,
                                                               @RequestHeader("X-Device-Id") String deviceId,
                                                               @RequestParam String theme) {

        UpdatePreferencesRequest request = new UpdatePreferencesRequest();
        request.setTheme(theme);
        return ResponseEntity.ok(preferencesService.updatePreferences(user.getId(), deviceId, request));
    }


    @PostMapping("/accounts/{accountId}/hide")
    public ResponseEntity<UserPreferencesResponse> hideAccount(@AuthenticationPrincipal AuthenticatedUser user,
                                                               @RequestHeader("X-Device-Id") String deviceId,
                                                               @PathVariable UUID accountId) {

        UserPreferencesResponse current = preferencesService.getPreferences(user.getId(), deviceId);
        current.hiddenAccountsIds().add(accountId);

        UpdatePreferencesRequest request = new UpdatePreferencesRequest();
        request.setHiddenAccountIds(current.hiddenAccountsIds());
        return ResponseEntity.ok(preferencesService.updatePreferences(user.getId(), deviceId, request));
    }


    @DeleteMapping("/accounts/{accountId}/hide")
    public ResponseEntity<UserPreferencesResponse> unhideAccount(@AuthenticationPrincipal AuthenticatedUser user,
                                                                 @RequestHeader("X-Device-Id") String deviceId,
                                                                 @PathVariable UUID accountId) {

        UserPreferencesResponse current = preferencesService.getPreferences(user.getId(), deviceId);
        current.hiddenAccountsIds().remove(accountId);

        UpdatePreferencesRequest request = new UpdatePreferencesRequest();
        request.setHiddenAccountIds(current.hiddenAccountsIds());
        return ResponseEntity.ok(preferencesService.updatePreferences(user.getId(), deviceId, request));
    }

    @PostMapping("/internal/push-tokens/query")
    @PreAuthorize("@internalSecurity.hasInternalAccess()")
    public ResponseEntity<List<PushTokenRecordResponse>> getPushTokens(@Valid @RequestBody PushTokenLookupRequest request) {

        return ResponseEntity.ok(preferencesService.getPushTokens(request.userIds()));
    }
}