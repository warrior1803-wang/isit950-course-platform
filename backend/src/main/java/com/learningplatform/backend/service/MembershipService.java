package com.learningplatform.backend.service;

import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.common.exception.NotFoundException;
import com.learningplatform.backend.dto.MembershipLimitsResponse;
import com.learningplatform.backend.dto.MembershipResponse;
import com.learningplatform.backend.dto.MembershipUpgradeRequest;
import com.learningplatform.backend.dto.MembershipUpgradeResponse;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.UserRole;
import com.learningplatform.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;

@Service
@RequiredArgsConstructor
public class MembershipService {

    private final UserRepository userRepository;

    public MembershipResponse getMembership(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.getRole() != UserRole.STUDENT) {
            throw new BusinessException("Only students can access membership");
        }

        String type = user.getMembershipType() == null ? "FREE" : user.getMembershipType();

        boolean isMember = "MEMBER".equals(type);

        return new MembershipResponse(
                type,
                user.getMembershipSince(),
                user.getMembershipExpiresAt(),
                new MembershipResponse.Benefits(
                        isMember,
                        isMember,
                        isMember
                ),
                new MembershipResponse.Usage(
                        0,
                        isMember ? null : 10,
                        0,
                        isMember ? null : 2
                )
        );
    }

    @Transactional
    public MembershipUpgradeResponse upgradeMembership(String userEmail, MembershipUpgradeRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.getRole() != UserRole.STUDENT) {
            throw new BusinessException("Only students can upgrade membership");
        }

        LocalDateTime since = LocalDateTime.now();
        LocalDateTime expiresAt;

        if ("MONTHLY".equals(request.getPlan())) {
            expiresAt = since.plusMonths(1);
        } else if ("ANNUAL".equals(request.getPlan())) {
            expiresAt = since.plusYears(1);
        } else {
            throw new BusinessException("Plan must be MONTHLY or ANNUAL");
        }

        user.setMembershipType("MEMBER");
        user.setMembershipSince(since);
        user.setMembershipExpiresAt(expiresAt);
        user.setMembershipPlan(request.getPlan());

        userRepository.save(user);

        return new MembershipUpgradeResponse(
                "Upgrade successful",
                new MembershipUpgradeResponse.UpgradedMembership(
                        "MEMBER",
                        since,
                        expiresAt,
                        request.getPlan()
                )
        );
    }

    public MembershipLimitsResponse getMembershipLimits(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.getRole() != UserRole.STUDENT) {
            throw new BusinessException("Only students can access membership limits");
        }

        String type = user.getMembershipType() == null ? "FREE" : user.getMembershipType();
        boolean isMember = "MEMBER".equals(type);

        int weeklyPostsUsed = 0;
        int resubmissionsUsed = 0;

        LocalDateTime resetsAt = LocalDateTime.now()
                .with(TemporalAdjusters.next(DayOfWeek.MONDAY))
                .toLocalDate()
                .atStartOfDay();

        if (isMember) {
            return new MembershipLimitsResponse(
                    new MembershipLimitsResponse.LimitItem(
                            weeklyPostsUsed,
                            null,
                            null,
                            resetsAt
                    ),
                    new MembershipLimitsResponse.LimitItem(
                            resubmissionsUsed,
                            null,
                            null,
                            null
                    )
            );
        }

        int postLimit = 10;
        int resubmissionLimit = 2;

        return new MembershipLimitsResponse(
                new MembershipLimitsResponse.LimitItem(
                        weeklyPostsUsed,
                        postLimit,
                        Math.max(postLimit - weeklyPostsUsed, 0),
                        resetsAt
                ),
                new MembershipLimitsResponse.LimitItem(
                        resubmissionsUsed,
                        resubmissionLimit,
                        Math.max(resubmissionLimit - resubmissionsUsed, 0),
                        null
                )
        );
    }
}