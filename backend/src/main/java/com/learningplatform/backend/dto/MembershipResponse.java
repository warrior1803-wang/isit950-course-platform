package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class MembershipResponse {

    private String type;
    private LocalDateTime since;
    private LocalDateTime expiresAt;
    private Benefits benefits;
    private Usage usage;

    @Getter
    @Setter
    @AllArgsConstructor
    public static class Benefits {
        private boolean unlimitedPosts;
        private boolean unlimitedResubmissions;
        private boolean priorityMaterials;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class Usage {
        private int weeklyPostsUsed;
        private Integer weeklyPostsLimit;
        private int resubmissionsUsed;
        private Integer resubmissionsLimit;
    }
}