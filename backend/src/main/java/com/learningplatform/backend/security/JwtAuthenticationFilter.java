package com.learningplatform.backend.security;

import com.learningplatform.backend.model.User;
import com.learningplatform.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Authenticates requests that carry a Bearer JWT token.
 *
 * <p>The filter runs once per request before the protected controller methods are reached.
 * It translates a valid token into a Spring Security Authentication object so later layers
 * can use {@code @PreAuthorize} and {@code Authentication#getName()} consistently.</p>
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    /**
     * Extracts, validates, and applies JWT authentication for the current request.
     *
     * <p>The token only proves identity after two checks: the user id must be readable
     * from the signed token, and the referenced user must still exist in the database.
     * This prevents deleted users from continuing to access protected course or grading
     * endpoints with an old token.</p>
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                final String jwt = authHeader.substring(7);
                final Long userId = jwtService.extractUserId(jwt);

                // Avoid overwriting an existing authentication set earlier in the chain.
                if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    User user = userRepository.findById(userId).orElse(null);

                    if (user != null && jwtService.isTokenValid(jwt, user)) {

                        // Store the user's email as the principal because services use it
                        // to load the current user and apply ownership checks.
                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(
                                        user.getEmail(),
                                        null,
                                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                                );

                        // Request details preserve useful context such as remote address
                        // without placing that responsibility on controller code.
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            } catch (Exception e) {
                // Token parsing failures stop the request immediately, because continuing
                // would make protected endpoints behave as if the client were anonymous.
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Invalid or expired token\",\"data\":null}"
                );
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}