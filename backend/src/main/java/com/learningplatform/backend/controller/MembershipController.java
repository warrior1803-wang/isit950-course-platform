package com.learningplatform.backend.controller;

import com.learningplatform.backend.dto.MembershipLimitsResponse;
import com.learningplatform.backend.dto.MembershipResponse;
import com.learningplatform.backend.dto.MembershipUpgradeRequest;
import com.learningplatform.backend.dto.MembershipUpgradeResponse;
import com.learningplatform.backend.service.MembershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/membership")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    public MembershipResponse getMembership(Authentication authentication) {
        return membershipService.getMembership(authentication.getName());
    }

    @PostMapping("/upgrade")
    @PreAuthorize("hasRole('STUDENT')")
    public MembershipUpgradeResponse upgradeMembership(
            @Valid @RequestBody MembershipUpgradeRequest request,
            Authentication authentication
    ) {
        return membershipService.upgradeMembership(authentication.getName(), request);
    }

    @GetMapping("/limits")
    @PreAuthorize("hasRole('STUDENT')")
    public MembershipLimitsResponse getMembershipLimits(Authentication authentication) {
        return membershipService.getMembershipLimits(authentication.getName());
    }
}