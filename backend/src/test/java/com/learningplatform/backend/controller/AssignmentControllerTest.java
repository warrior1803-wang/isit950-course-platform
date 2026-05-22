package com.learningplatform.backend.controller;

import com.learningplatform.backend.common.exception.ResubmissionLimitException;
import com.learningplatform.backend.dto.FileSubmissionResponse;
import com.learningplatform.backend.dto.ResubmissionLimitResponse;
import com.learningplatform.backend.service.AssignmentService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

class AssignmentControllerTest {

    @Test
    void returnsForbiddenWhenResubmissionLimitIsReached() {
        AssignmentController controller = new AssignmentController(new LimitThrowingAssignmentService());

        ResponseEntity<?> response = controller.submitFileAssignment(
                10L,
                20L,
                new MockMultipartFile("file", "submission.pdf", "application/pdf", "content".getBytes()),
                new TestAuthentication()
        );

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        ResubmissionLimitResponse body = assertInstanceOf(
                ResubmissionLimitResponse.class,
                response.getBody()
        );
        assertEquals("Resubmission limit reached", body.getError());
        assertEquals(Boolean.TRUE, body.getUpgradeRequired());
    }

    private static class LimitThrowingAssignmentService extends AssignmentService {

        LimitThrowingAssignmentService() {
            super(null, null, null, null, null);
        }

        @Override
        public FileSubmissionResponse submitFileAssignment(
                Long courseId,
                Long assignmentId,
                MultipartFile file,
                String studentEmail
        ) {
            throw new ResubmissionLimitException();
        }
    }

    private static class TestAuthentication implements Authentication {

        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
            return List.of();
        }

        @Override
        public Object getCredentials() {
            return null;
        }

        @Override
        public Object getDetails() {
            return null;
        }

        @Override
        public Object getPrincipal() {
            return "student@example.com";
        }

        @Override
        public boolean isAuthenticated() {
            return true;
        }

        @Override
        public void setAuthenticated(boolean isAuthenticated) {
        }

        @Override
        public String getName() {
            return "student@example.com";
        }
    }
}
