package com.learningplatform.backend.dto;

import com.learningplatform.backend.model.enums.CollabMode;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateProfileRequest {

    private String name;

    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    private String password;

    private List<String> skills;
    private CollabMode collabMode;
    private String availability;
}
