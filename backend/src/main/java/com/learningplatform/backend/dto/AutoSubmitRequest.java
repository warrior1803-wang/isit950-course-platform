package com.learningplatform.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class AutoSubmitRequest {

    private Map<String, Object> answers;
}