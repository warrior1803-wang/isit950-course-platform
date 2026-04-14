package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class CourseResponse {

    private Long id;
    private String name;
    private String code;
    private String description;
    private String schedule;
    private String location;
    private LocalDateTime createdAt;
    private Long instructorId;
    private String instructorName;
    private long assignmentCount;
    private long pendingCount;
}