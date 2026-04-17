package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class PostResponse {
    private Long id;
    private String title;
    private String body;
    private UserSummaryResponse author;
    private LocalDateTime createdAt;
    private List<ReplyResponse> replies;
}
