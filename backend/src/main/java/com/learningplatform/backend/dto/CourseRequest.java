package com.learningplatform.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CourseRequest {

    @NotBlank(message = "Course name is required")
    @Size(max = 100, message = "Course name must be 100 characters or fewer")
    private String name;

    @NotBlank(message = "Course code is required")
    @Size(max = 15, message = "Course code must be 15 characters or fewer")
    private String code;

    @NotBlank(message = "Course description is required")
    @Size(max = 500, message = "Description must be 500 characters or fewer")
    private String description;

    @Size(max = 20, message = "Session must be 20 characters or fewer")
    private String schedule;

    @Size(max = 100, message = "Location must be 100 characters or fewer")
    private String location;
}
