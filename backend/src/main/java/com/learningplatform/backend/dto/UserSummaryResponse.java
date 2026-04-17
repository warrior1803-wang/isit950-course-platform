package com.learningplatform.backend.dto;

import com.learningplatform.backend.model.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class UserSummaryResponse {
    private Long id;
    private String name;
    private UserRole role;
}
