package com.internetbank.db.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "user_preferences",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "device_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferences {

    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    @Column(name = "theme", nullable = false)
    private String theme;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "hidden_accounts",
            joinColumns = @JoinColumn(name = "preferences_id"),
            foreignKey = @ForeignKey(name = "fk_hidden_accounts_preferences")
    )
    @Column(name = "account_id", nullable = false)
    @Builder.Default
    private Set<UUID> hiddenAccountIds = new HashSet<>();


    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}