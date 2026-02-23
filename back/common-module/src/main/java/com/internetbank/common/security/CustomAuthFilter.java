package com.internetbank.common.security;

import com.internetbank.common.clients.UserAppClient;
import com.internetbank.common.dtos.UserDTO;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomAuthFilter extends OncePerRequestFilter {

    @Value("${internal.api.key}")
    private String internalApiKey;

    private final JwtService jwtService;
    private final UserAppClient userAppClient;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String path = request.getServletPath();
        if (path.contains("/api/v1/auth")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String internalHeader = request.getHeader("X-Internal-Request");
        final String authHeader = request.getHeader("Authorization");

        if (internalHeader != null && internalHeader.equals(internalApiKey)) {
            UsernamePasswordAuthenticationToken internalAuth =
                    new UsernamePasswordAuthenticationToken(
                            "internal-service", null,
                            List.of(new SimpleGrantedAuthority("ROLE_INTERNAL"))
                    );
            SecurityContextHolder.getContext().setAuthentication(internalAuth);
            filterChain.doFilter(request, response);
            return;
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        try {
            UUID userId = jwtService.extractUserId(jwt);

            if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDTO user = null;
                try {
                    user = userAppClient.getUserById(userId);
                } catch (Exception e) {
                    log.warn("Failed to fetch user from user-service: {}", e.getMessage(), e);
                }
                if (user != null && !user.isBlocked()) {
                    List<GrantedAuthority> authorities = user.role() == null
                            ? List.of()
                            : List.of(new SimpleGrantedAuthority("ROLE_" + user.role().name()));

                    UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                            user, jwt, authorities
                    );
                    SecurityContextHolder.getContext().setAuthentication(token);
                } else if (user != null) {
                    denyAccess(response, "Account is blocked");
                    return;
                } else {
                    denyAccess(response, "Auth error");
                    return;
                }
            }

        } catch (ExpiredJwtException e) {
            log.debug("JWT expired: {}", e.getMessage());
        } catch (Exception e) {
            log.error("JWT processing error", e);
        }

        filterChain.doFilter(request, response);
    }

    private void denyAccess(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String errorMessage = "{\"message\": \"" + message + "\"}";
        response.getWriter().write(errorMessage);
    }
}
