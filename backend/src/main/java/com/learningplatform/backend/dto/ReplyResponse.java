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
public class ReplyResponse {
    private Long id;
    private String body;
    private UserSummaryResponse author;
    private LocalDateTime createdAt;
    private Integer weeklyPostsUsed;
    private Integer weeklyPostsLimit;
}
