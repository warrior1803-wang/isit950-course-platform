package com.learningplatform.backend.service;

import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.common.exception.ConflictException;
import com.learningplatform.backend.common.exception.UnauthorizedException;
import com.learningplatform.backend.dto.AuthResponse;
import com.learningplatform.backend.dto.AuthUserResponse;
import com.learningplatform.backend.dto.LoginRequest;
import com.learningplatform.backend.dto.RegisterRequest;
import com.learningplatform.backend.dto.UpdateProfileRequest;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.UserRole;
import com.learningplatform.backend.repository.UserRepository;
import com.learningplatform.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
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
        user.setWeeklyDiscussionPostsUsed(0);

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

        List<String> skills = user.getSkills() == null ? List.of() : user.getSkills();

        AuthUserResponse.MembershipResponse membership =
                new AuthUserResponse.MembershipResponse(
                        user.getMembershipType() == null ? "FREE" : user.getMembershipType(),
                        user.getMembershipSince(),
                        user.getMembershipExpiresAt()
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

    public AuthUserResponse updateCurrentUser(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (user.getRole() == UserRole.STUDENT) {
            if (request.getSkills() != null) {
                user.setSkills(request.getSkills());
            }

            if (request.getCollabMode() != null) {
                user.setCollabMode(request.getCollabMode());
            }

            if (request.getAvailability() != null) {
                user.setAvailability(request.getAvailability());
            }
        }

        User savedUser = userRepository.save(user);

        return toAuthUserResponse(savedUser);
    }
}
