package com.learningplatform.backend.service;

import com.learningplatform.backend.dto.AuthUserResponse;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.UserRole;
import com.learningplatform.backend.repository.UserRepository;
import com.learningplatform.backend.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthServiceTest {

    @Test
    void currentUserResponseIncludesPersistedMembership() {
        LocalDateTime since = LocalDateTime.of(2026, 5, 22, 5, 4);
        LocalDateTime expiresAt = LocalDateTime.of(2026, 6, 22, 5, 4);
        User user = new User();
        user.setId(1L);
        user.setName("Alex Wang");
        user.setEmail("alex@student.com");
        user.setRole(UserRole.STUDENT);
        user.setMembershipType("MEMBER");
        user.setMembershipSince(since);
        user.setMembershipExpiresAt(expiresAt);

        AuthService service = new AuthService(
                userRepositoryFor(user),
                emptyProxy(PasswordEncoder.class),
                new JwtService()
        );

        AuthUserResponse response = service.getCurrentUserResponse(user.getEmail());

        assertEquals("MEMBER", response.getMembership().getType());
        assertEquals(since, response.getMembership().getSince());
        assertEquals(expiresAt, response.getMembership().getExpiresAt());
    }

    private UserRepository userRepositoryFor(User user) {
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class[]{UserRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByEmail" -> Optional.of(user);
                    case "toString" -> "UserRepositoryProxy";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> unsupported(method.getName());
                }
        );
    }

    @SuppressWarnings("unchecked")
    private <T> T emptyProxy(Class<T> type) {
        return (T) Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class[]{type},
                (proxy, method, args) -> switch (method.getName()) {
                    case "toString" -> type.getSimpleName() + "Proxy";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> unsupported(method.getName());
                }
        );
    }

    private Object unsupported(String methodName) {
        throw new UnsupportedOperationException("Unexpected call: " + methodName);
    }
}
