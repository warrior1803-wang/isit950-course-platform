package com.learningplatform.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MembershipLimitsResponse {

    private LimitItem posts;
    private LimitItem resubmissions;

    @Getter
    @Setter
    @AllArgsConstructor
    public static class LimitItem {
        private int used;
        private Integer limit;
        private Integer remaining;
        private LocalDateTime resetsAt;
    }
}