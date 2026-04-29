package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class StudentSummaryResponse {

    private Long id;
    private String name;
    private String email;
    private MembershipSummary membership;

    @Getter
    @Setter
    @AllArgsConstructor
    public static class MembershipSummary {
        private String type;
    }
}