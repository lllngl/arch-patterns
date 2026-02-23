package com.internetbank.common.security;

import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.enums.RoleName;
import com.internetbank.common.exceptions.ForbiddenException;
import com.internetbank.common.exceptions.NotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.function.Function;

@Slf4j
@Component
public class ResourceAccessService {
    public <T> T getResourceAndCheckAuthorization(
            UUID resourceId,
            UserDTO user,
            JpaRepository<T, UUID> repository,
            String resourceName,
            Function<T, UUID> userIdExtractor) {

        T resource = repository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException(
                        String.format("%s not found with ID: %s", resourceName, resourceId)));

        UUID resourceUserId = userIdExtractor.apply(resource);

        if (resourceUserId == null || user == null || user.id() == null) {
            log.error("Null user ID detected - resource: {}, current user: {}",
                    resourceUserId, user == null ? null : user.id());
            throw new ForbiddenException("Invalid user information detected. Please contact support.");
        }

        boolean isEmployee = user.role() == RoleName.EMPLOYEE;

        if (!resourceUserId.equals(user.id()) && !isEmployee) {
            throw new ForbiddenException(
                    String.format("You are not authorized to access this %s.",
                            resourceName.toLowerCase()));
        }

        return resource;
    }
}

