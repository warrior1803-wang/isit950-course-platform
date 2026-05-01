package com.learningplatform.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PostLimitResponse {

    private String error;
    private Boolean upgradeRequired;
}
