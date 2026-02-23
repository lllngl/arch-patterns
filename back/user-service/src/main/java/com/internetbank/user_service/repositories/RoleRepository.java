package com.internetbank.user_service.repositories;

import com.internetbank.common.enums.RoleName;
import com.internetbank.user_service.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByRolename(RoleName rolename);
}
