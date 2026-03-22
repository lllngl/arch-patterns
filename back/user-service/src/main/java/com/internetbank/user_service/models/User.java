package com.internetbank.user_service.models;

import com.internetbank.common.audit.Auditable;
import com.internetbank.user_service.enums.Gender;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends Auditable {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(updatable = false)
    private UUID id;

    @Column(nullable = false, name = "first_name")
    @Size(min = 1, max = 85, message = "FirstName must be between 1 and 85 characters.")
    @NotBlank(message = "FirstName is required.")
    private String firstName;

    @Column(nullable = false, name = "last_name")
    @Size(min = 1, max = 85, message = "LastName must be between 1 and 85 characters.")
    @NotBlank(message = "LastName is required.")
    private String lastName;

    @Column(nullable = true)
    @Size(max = 85, message = "Patronymic must be less than 85 characters.")
    private String patronymic;

    @Positive(message = "Phone number must be a positive number.")
    @NotNull(message = "Phone is required.")
    @Column(unique = true, nullable = false)
    @Digits(integer = 15, fraction = 0, message = "Phone number can only contain digits and must not exceed 15 digits.")
    private Long phone;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Gender is required.")
    private Gender gender;

    @Column(unique = true, nullable = false, length = 30)
    @Size(min = 5, max = 30, message = "Email must be between 5 and 30 characters.")
    @NotBlank(message = "Email is required.")
    @Email(message = "Invalid email format.")
    private String email;

    @Column(name = "keycloak_user_id", unique = true)
    private String keycloakUserId;

    @Past(message = "Birth date must be in the past.")
    @NotNull(message = "Birth date is required.")
    @Column(nullable = false, name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "is_blocked", nullable = false)
    @ColumnDefault("FALSE")
    @Builder.Default
    @NotNull(message = "IsBlocked is required.")
    private boolean isBlocked = false;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "users_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();
}