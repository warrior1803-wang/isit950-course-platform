package com.learningplatform.backend.service;

import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.common.exception.ConflictException;
import com.learningplatform.backend.common.exception.UnauthorizedException;
import com.learningplatform.backend.dto.AuthResponse;
import com.learningplatform.backend.dto.AuthUserResponse;
import com.learningplatform.backend.dto.LoginRequest;
import com.learningplatform.backend.dto.RegisterRequest;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.UserRole;
import com.learningplatform.backend.repository.UserRepository;
import com.learningplatform.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email is already registered");
        }

        if (request.getRole() == null) {
            throw new BusinessException("Role is required");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());

        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser);

        AuthUserResponse userResponse = toAuthUserResponse(savedUser);

        return new AuthResponse(token, userResponse);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);

        AuthUserResponse userResponse = toAuthUserResponse(user);

        return new AuthResponse(token, userResponse);
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));
    }

    private AuthUserResponse toAuthUserResponse(User user) {
        if (user.getRole() != UserRole.STUDENT) {
            return new AuthUserResponse(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole()
            );
        }

        List<String> skills = Collections.emptyList();

        if (user.getSkills() != null && !user.getSkills().isBlank()) {
            skills = Arrays.stream(user.getSkills().split(","))
                    .map(String::trim)
                    .filter(skill -> !skill.isBlank())
                    .toList();
        }

        AuthUserResponse.MembershipResponse membership =
                new AuthUserResponse.MembershipResponse(
                        "FREE",
                        null,
                        null
                );

        return new AuthUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                skills,
                user.getCollabMode(),
                user.getAvailability(),
                membership
        );
    }

    public AuthUserResponse getCurrentUserResponse(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        return toAuthUserResponse(user);
    }
}