package com.learningplatform.backend.security;

import com.learningplatform.backend.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Creates and validates JWT tokens for stateless authentication.
 *
 * <p>The token carries the minimum identity data needed by the backend:
 * the user's email as the subject, the database user id for stable lookup,
 * and the role for request authorisation. Sensitive information such as
 * passwords or membership payment data is deliberately excluded.</p>
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    /**
     * Builds a signed token after successful login or registration.
     *
     * <p>The user id is included because email can theoretically change over time,
     * while the database id remains the safest reference for validating the current
     * account. The role claim supports role-aware frontend behaviour, while backend
     * permissions are still enforced through Spring Security.</p>
     */
    public String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Reads the email stored as the token subject.
     *
     * <p>Although the authentication filter primarily uses user id, exposing the
     * subject keeps the service compatible with code paths that need the login email.</p>
     */
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Extracts the database user id from the JWT claims.
     *
     * <p>JSON number deserialisation may return either Integer or Long depending on
     * token content and parser behaviour, so both cases are handled explicitly.</p>
     */
    public Long extractUserId(String token) {
        Object userId = extractAllClaims(token).get("userId");

        if (userId instanceof Integer) {
            return ((Integer) userId).longValue();
        }

        if (userId instanceof Long) {
            return (Long) userId;
        }

        return null;
    }

    /**
     * Confirms that a token still belongs to the given database user.
     *
     * <p>This check combines identity matching and expiry validation. A correctly
     * signed token is not enough if it refers to a different user or has already
     * expired.</p>
     */
    public boolean isTokenValid(String token, User user) {
        final Long extractedUserId = extractUserId(token);

        return extractedUserId != null
                && extractedUserId.equals(user.getId())
                && !isTokenExpired(token);
    }

    /**
     * Checks whether the token lifetime has passed.
     */
    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    /**
     * Parses and verifies all claims using the configured signing key.
     *
     * <p>If the signature is invalid or the token is malformed, the JWT library throws
     * an exception. The authentication filter catches that failure and returns 401.</p>
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Converts the Base64 environment secret into an HMAC signing key.
     *
     * <p>The secret is injected from configuration instead of being hardcoded so the
     * same codebase can run safely across local development and deployment environments.</p>
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}