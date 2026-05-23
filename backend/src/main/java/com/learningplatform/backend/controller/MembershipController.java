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

/**
 * Handles student membership status and upgrade workflows.
 *
 * <p>The membership system controls premium platform capabilities such as
 * increased posting allowances and additional resubmission opportunities
 * for assignments.</p>
 */
@RestController
@RequestMapping("/api/membership")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    /**
     * Returns the authenticated student's current membership information.
     *
     * <p>The response includes membership tier details and expiration-related
     * data required by frontend account pages.</p>
     */
    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    public MembershipResponse getMembership(
            Authentication authentication
    ) {

        return membershipService.getMembership(authentication.getName());
    }

    /**
     * Upgrades a student membership plan.
     *
     * <p>The backend validates the requested upgrade path before applying
     * membership changes to the student's account.</p>
     */
    @PostMapping("/upgrade")
    @PreAuthorize("hasRole('STUDENT')")
    public MembershipUpgradeResponse upgradeMembership(
            @Valid @RequestBody MembershipUpgradeRequest request,
            Authentication authentication
    ) {

        return membershipService.upgradeMembership(
                authentication.getName(),
                request
        );
    }

    /**
     * Returns current usage limits tied to the student's membership tier.
     *
     * <p>This endpoint supports frontend limit indicators such as remaining
     * discussion posts and assignment resubmission counts.</p>
     */
    @GetMapping("/limits")
    @PreAuthorize("hasRole('STUDENT')")
    public MembershipLimitsResponse getMembershipLimits(
            Authentication authentication
    ) {

        return membershipService.getMembershipLimits(authentication.getName());
    }
}