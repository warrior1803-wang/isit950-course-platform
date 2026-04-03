package com.learningplatform.backend.service;

import com.learningplatform.backend.dto.AuthResponse;
import com.learningplatform.backend.dto.LoginRequest;
import com.learningplatform.backend.dto.RegisterRequest;
import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.repository.UserRepository;
import com.learningplatform.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
            throw new BusinessException("Email is already registered");
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

        String token = jwtService.generateToken(savedUser.getEmail());
        return new AuthResponse(token);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token);
    }
}