package com.learningplatform.backend.dto;

import com.learningplatform.backend.model.enums.AssignmentType;
import com.learningplatform.backend.model.enums.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class CreateAssignmentRequest {

    @Size(max = 200, message = "Title must be 200 characters or fewer")
    private String title;

    @Size(max = 1000, message = "Description must be 1000 characters or fewer")
    private String description;

    private LocalDateTime dueDate;

    private Integer maxScore;

    private Integer fileSizeLimitMb;

    private AssignmentType type;

    @Valid
    private List<QuestionRequest> questions;

    @Getter
    @Setter
    public static class QuestionRequest {

        private String id;

        private QuestionType type;

        @Size(max = 500, message = "Question text must be 500 characters or fewer")
        private String text;

        private Integer points;

        private List<
                @Size(max = 200, message = "Option must be 200 characters or fewer")
                        String
                > options;

        private Integer correctOption;

        @Size(max = 200, message = "Answer must be 200 characters or fewer")
        private String correctAnswer;
    }
}