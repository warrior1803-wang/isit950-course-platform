package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class MyProgressResponse {

    private Long courseId;
    private long assignmentsSubmitted;
    private long totalAssignments;
    private Double averageScore;
}