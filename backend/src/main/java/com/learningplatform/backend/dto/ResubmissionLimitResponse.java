package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ResubmissionLimitResponse {

    private String error;
    private Boolean upgradeRequired;
}