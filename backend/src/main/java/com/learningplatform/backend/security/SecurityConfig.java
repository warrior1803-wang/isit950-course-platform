package com.learningplatform.backend.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configures Spring Security for the REST API layer.
 *
 * <p>The platform uses JWT-based stateless authentication rather than
 * server-side HTTP sessions. Security rules are applied centrally here so
 * controllers can focus on business workflows such as enrolment, grading,
 * discussion management, and membership enforcement.</p>
 */
@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    /**
     * Defines the security filter chain for all incoming HTTP requests.
     *
     * <p>The configuration disables CSRF because the backend operates as a
     * stateless REST API consumed by a separate frontend application.
     * JWT authentication is enforced through a custom filter placed before
     * Spring Security's username/password authentication filter.</p>
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http

                // CSRF protection is unnecessary for token-based APIs where
                // authentication is handled through Authorization headers.
                .csrf(csrf -> csrf.disable())

                // Enables the global CORS configuration so the React frontend
                // can communicate with the backend from a different origin.
                .cors(Customizer.withDefaults())

                // Stateless session management ensures authentication is derived
                // entirely from the JWT token on each request.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth

                        // Browsers send preflight OPTIONS requests before
                        // authenticated cross-origin requests.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Health check endpoints remain public so deployment
                        // platforms can monitor application availability.
                        .requestMatchers("/actuator/health").permitAll()

                        // Login and registration must remain publicly accessible
                        // so new users can authenticate and create accounts.
                        .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()

                        // All remaining endpoints require authentication.
                        .anyRequest().authenticated()
                )

                .exceptionHandling(ex -> ex

                        // 401 indicates the request does not contain a valid identity.
                        // This usually means the JWT is missing, expired, or malformed.
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");

                            response.getWriter().write(
                                    "{\"success\":false,\"message\":\"Unauthorized\",\"data\":null}"
                            );
                        })

                        // 403 indicates the user is authenticated but lacks permission
                        // to perform the requested action.
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json;charset=UTF-8");

                            response.getWriter().write(
                                    "{\"success\":false,\"message\":\"Forbidden\",\"data\":null}"
                            );
                        })
                )

                // The JWT filter runs before Spring Security attempts username/password
                // authentication so the SecurityContext can be populated early.
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    /**
     * Uses BCrypt hashing for password storage and verification.
     *
     * <p>Passwords are never stored in plain text. BCrypt automatically applies
     * salting and computational cost factors to reduce the impact of leaked hashes.</p>
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
