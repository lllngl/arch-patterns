package com.internetbank.common.audit;


import com.internetbank.common.dtos.UserDTO;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class SpringSecurityAuditorAware implements AuditorAware<String> {
    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("system")) {
            return Optional.of("system");
        }

        if (authentication.getPrincipal() instanceof UserDTO userDTO) {
            return Optional.ofNullable(userDTO.email());
        }

        if (authentication.getPrincipal() instanceof String principalString) {
            return Optional.of(principalString);
        }

        return Optional.empty();
    }
}
