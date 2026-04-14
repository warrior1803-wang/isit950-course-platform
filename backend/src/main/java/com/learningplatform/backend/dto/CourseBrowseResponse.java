package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class CourseBrowseResponse {

    private Long id;
    private String name;
    private String code;
    private String description;
    private InstructorSummaryResponse instructor;
    private long enrolledCount;
    private boolean isEnrolled;
}