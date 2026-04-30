package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EnrolmentResponse {

    private Long id;
    private String name;
    private String email;
    private Membership membership;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Membership {
        private String type;
    }
}