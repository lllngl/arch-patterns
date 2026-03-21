package com.internetbank.user_service.models;

import com.internetbank.common.audit.Auditable;
import com.internetbank.common.enums.RoleName;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Role extends Auditable {
    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true, nullable = false)
    @NotNull(message = "Role name is required.")
    @Size(max=20, message = "Role name cannot exceed 20 characters.")
    private RoleName rolename;

    @ManyToMany(mappedBy = "roles")
    private Set<User> users = new HashSet<>();

}