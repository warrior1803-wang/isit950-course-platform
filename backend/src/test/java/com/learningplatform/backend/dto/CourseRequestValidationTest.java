package com.learningplatform.backend.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

class CourseRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsCourseFieldsOverLengthLimits() {
        CourseRequest request = new CourseRequest();
        request.setName("a".repeat(101));
        request.setCode("b".repeat(16));
        request.setSchedule("c".repeat(21));
        request.setLocation("d".repeat(101));
        request.setDescription("e".repeat(501));

        Set<ConstraintViolation<CourseRequest>> violations = validator.validate(request);

        assertTrue(hasMessage(violations, "Course name must be 100 characters or fewer"));
        assertTrue(hasMessage(violations, "Course code must be 15 characters or fewer"));
        assertTrue(hasMessage(violations, "Session must be 20 characters or fewer"));
        assertTrue(hasMessage(violations, "Location must be 100 characters or fewer"));
        assertTrue(hasMessage(violations, "Description must be 500 characters or fewer"));
    }

    private boolean hasMessage(Set<ConstraintViolation<CourseRequest>> violations, String message) {
        return violations.stream().anyMatch(violation -> message.equals(violation.getMessage()));
    }
}
