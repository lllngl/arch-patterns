package com.internetbank.user_service.models;

import com.internetbank.common.audit.Auditable;
import jakarta.persistence.*;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Token extends Auditable {

    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;

    @Column(nullable = false, unique = true)
    @NotBlank(message = "Token string is required.")
    @Size(max = 512, message = "Token string cannot exceed 512 characters.")
    private String token;

    @Column(nullable = false, unique = true)
    @NotNull(message = "Token ID is required.")
    private UUID tokenId;

    @Column(nullable = false, name="expiration_date_time")
    @NotNull(message = "Expiration date and time is required.")
    @Future(message = "Expiration date and time must be in the future.")
    private Instant expirationDateTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required for the token.")
    public User user;
}