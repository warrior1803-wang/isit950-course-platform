package com.learningplatform.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.learningplatform.backend.model.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthUserResponse {

    private Long id;
    private String name;
    private String email;
    private UserRole role;

    private List<String> skills;
    private String collabMode;
    private String availability;
    private MembershipResponse membership;

    public AuthUserResponse(Long id, String name, String email, UserRole role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MembershipResponse {
        private String type;
        private LocalDateTime since;
        private LocalDateTime expiresAt;
    }
}