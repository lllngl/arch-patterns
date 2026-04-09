package com.internetbank.service;

import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.db.model.UserPreferences;
import com.internetbank.db.repository.UserPreferencesRepository;
import com.internetbank.dto.request.DeviceRegistrationRequest;
import com.internetbank.dto.request.UpdatePreferencesRequest;
import com.internetbank.dto.response.UserPreferencesResponse;
import com.internetbank.mapper.UserPreferencesMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserPreferencesService {

    private final UserPreferencesRepository preferencesRepository;
    private final UserPreferencesMapper mapper;

    @Transactional(readOnly = true)
    public UserPreferencesResponse getPreferences(UUID userId, String deviceId) {
        return preferencesRepository.findByUserIdAndDeviceId(userId, deviceId)
                .map(mapper::toDto)
                .orElseThrow(() -> new NotFoundException(
                        "Preferences not found for user: " + userId + " and device: " + deviceId));
    }

    @Transactional(readOnly = true)
    public List<UserPreferencesResponse> getAllUserPreferences(UUID userId) {
        return preferencesRepository.findAllByUserId(userId).stream()
                .map(mapper::toDto)
                .toList();
    }

    @Transactional
    public UserPreferencesResponse updatePreferences(UUID userId, String deviceId, UpdatePreferencesRequest request) {
        UserPreferences preferences = preferencesRepository.findByUserIdAndDeviceId(userId, deviceId)
                .orElseThrow(() -> new NotFoundException(
                        "Preferences not found for user: " + userId + " and device: " + deviceId));

        if (request.getTheme() != null) {
            preferences.setTheme(request.getTheme());
        }

        if (request.getHiddenAccountIds() != null) {
            preferences.setHiddenAccountIds(request.getHiddenAccountIds());
        }

        UserPreferences saved = preferencesRepository.save(preferences);
        log.info("Updated preferences for user: {} on device: {}", userId, deviceId);
        return mapper.toDto(saved);
    }

    @Transactional
    public UserPreferencesResponse registerDevice(UUID userId, DeviceRegistrationRequest request) {
        String deviceId = request.getDeviceId();

        if (preferencesRepository.existsByUserIdAndDeviceId(userId, deviceId)) {
            return getPreferences(userId, deviceId);
        }

        UserPreferences newPreferences = UserPreferences.builder()
                .userId(userId)
                .deviceId(deviceId)
                .theme("LIGHT")
                .hiddenAccountIds(Set.of())
                .build();

        UserPreferences saved = preferencesRepository.save(newPreferences);
        log.info("Registered new device: {} for user: {}", deviceId, userId);
        return mapper.toDto(saved);
    }

    @Transactional
    public void unregisterDevice(UUID userId, String deviceId) {
        preferencesRepository.deleteByUserIdAndDeviceId(userId, deviceId);
        log.info("Unregistered device: {} for user: {}", deviceId, userId);
    }
}