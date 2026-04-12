package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class MaterialResponse {

    private Long id;
    private String filename;
    private String url;
    private Long size;
    private String section;
    private LocalDateTime uploadedAt;
}