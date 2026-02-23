package com.internetbank.user_service.models;

import com.internetbank.common.audit.Auditable;
import com.internetbank.user_service.enums.Gender;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.util.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends Auditable implements UserDetails{

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

    @NotBlank(message = "Password is required.")
    @Size(max = 255, message = "Password must be less than 255 characters.")
    @Column(nullable = false)
    private String password;

    @Past(message = "Birth date must be in the past.")
    @NotNull(message = "Birth date is required.")
    @Column(nullable = false, name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "is_blocked", nullable = false)
    @ColumnDefault("FALSE")
    @Builder.Default
    @NotNull(message = "IsBlocked is required.")
    private boolean isBlocked = false;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @OneToMany(mappedBy = "user")
    private List<Token> tokens;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return role == null ? List.of() : Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.getRolename().name()));
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !isBlocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return !this.isBlocked;
    }
}