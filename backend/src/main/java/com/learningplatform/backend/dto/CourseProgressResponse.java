package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class CourseProgressResponse {

    private Long courseId;
    private List<StudentProgressItem> students;

    @Getter
    @Setter
    @AllArgsConstructor
    public static class StudentProgressItem {
        private Long studentId;
        private String name;
        private long assignmentsSubmitted;
        private long totalAssignments;
        private Double averageScore;
        private int postsCount;
        private int repliesCount;
        private String lastActive;
    }
}
