package com.internetbank.common.audit;


import com.internetbank.common.security.AuthenticatedUser;
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

        if (authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser) {
            return Optional.ofNullable(authenticatedUser.getEmail());
        }

        if (authentication.getPrincipal() instanceof String principalString) {
            return Optional.of(principalString);
        }

        return Optional.empty();
    }
}
