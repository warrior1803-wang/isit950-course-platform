package com.learningplatform.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MembershipUpgradeRequest {

    @NotBlank(message = "Plan is required")
    @Pattern(regexp = "MONTHLY|ANNUAL", message = "Plan must be MONTHLY or ANNUAL")
    private String plan;

    @NotBlank(message = "Payment token is required")
    private String paymentToken;
}