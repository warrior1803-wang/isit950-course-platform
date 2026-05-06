package com.learningplatform.backend.dto;

import com.learningplatform.backend.model.enums.CollabMode;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateProfileRequest {

    private String name;
    private String password;

    private List<String> skills;
    private CollabMode collabMode;
    private String availability;
}