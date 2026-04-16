package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class ReplyResponse {
    private Long id;
    private String body;
    private UserSummaryResponse author;
    private LocalDateTime createdAt;
}
