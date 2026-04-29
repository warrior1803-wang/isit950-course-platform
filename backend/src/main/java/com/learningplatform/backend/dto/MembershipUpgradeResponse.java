package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class MembershipUpgradeResponse {

    private String message;
    private UpgradedMembership membership;

    @Getter
    @Setter
    @AllArgsConstructor
    public static class UpgradedMembership {
        private String type;
        private LocalDateTime since;
        private LocalDateTime expiresAt;
        private String plan;
    }
}