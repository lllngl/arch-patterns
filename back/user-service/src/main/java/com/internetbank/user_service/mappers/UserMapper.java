package com.internetbank.user_service.mappers;

import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.enums.RoleName;
import com.internetbank.user_service.dto.UserEditDTO;
import com.internetbank.user_service.dto.UserRegisterDTO;
import com.internetbank.user_service.models.Role;
import com.internetbank.user_service.models.User;
import org.mapstruct.*;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "isBlocked", constant = "false")
    @Mapping(target = "keycloakUserId", ignore = true)
    @Mapping(target = "roles", ignore = true)
    User userRegisterDtoToUser(UserRegisterDTO userRegisterDTO);

    @Mapping(target = "roles", source = "roles", qualifiedByName = "mapRoles")
    @Mapping(target = "isBlocked", source = "blocked")
    UserDTO userToUserDto(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "keycloakUserId", ignore = true)
    @Mapping(target = "blocked", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "modifiedAt", ignore = true)
    @Mapping(target = "modifiedBy", ignore = true)
    @Mapping(target = "roles", ignore = true)
    void updateUserFromDto(UserEditDTO userEditDTO, @MappingTarget User user);

    @Named("mapRoles")
    default Set<RoleName> mapRoles(Set<Role> roles) {
        if (roles == null || roles.isEmpty()) {
            return Set.of();
        }
        return roles.stream()
                .map(Role::getRolename)
                .collect(Collectors.toUnmodifiableSet());
    }
}