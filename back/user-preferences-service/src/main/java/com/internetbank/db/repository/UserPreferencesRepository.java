package com.internetbank.db.repository;

import com.internetbank.db.model.UserPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPreferencesRepository extends JpaRepository<UserPreferences, UUID> {

    Optional<UserPreferences> findByUserIdAndDeviceId(UUID userId, String deviceId);

    List<UserPreferences> findAllByUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM UserPreferences up WHERE up.userId = :userId AND up.deviceId = :deviceId")
    void deleteByUserIdAndDeviceId(@Param("userId") UUID userId, @Param("deviceId") String deviceId);

    boolean existsByUserIdAndDeviceId(UUID userId, String deviceId);
}