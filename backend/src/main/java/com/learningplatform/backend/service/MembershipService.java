package com.learningplatform.backend.service;

import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.common.exception.NotFoundException;
import com.learningplatform.backend.dto.MembershipLimitsResponse;
import com.learningplatform.backend.dto.MembershipResponse;
import com.learningplatform.backend.dto.MembershipUpgradeRequest;
import com.learningplatform.backend.dto.MembershipUpgradeResponse;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.UserRole;
import com.learningplatform.backend.repository.PostRepository;
import com.learningplatform.backend.repository.ReplyRepository;
import com.learningplatform.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;

@Service
public class MembershipService {

    public static final int WEEKLY_POST_LIMIT = 10;

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ReplyRepository replyRepository;
    private final Clock clock;

    @Autowired
    public MembershipService(
            UserRepository userRepository,
            PostRepository postRepository,
            ReplyRepository replyRepository
    ) {
        this(userRepository, postRepository, replyRepository, Clock.systemUTC());
    }

    MembershipService(
            UserRepository userRepository,
            PostRepository postRepository,
            ReplyRepository replyRepository,
            Clock clock
    ) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.replyRepository = replyRepository;
        this.clock = clock;
    }

    public MembershipResponse getMembership(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.getRole() != UserRole.STUDENT) {
            throw new BusinessException("Only students can access membership");
        }

        String type = user.getMembershipType() == null ? "FREE" : user.getMembershipType();
        boolean isMember = "MEMBER".equals(type);
        int weeklyPostsUsed = refreshDiscussionUsageWindow(user).used();

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
                        weeklyPostsUsed,
                        isMember ? null : WEEKLY_POST_LIMIT,
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

        LocalDateTime since = LocalDateTime.now(clock);
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

    @Transactional
    public MembershipLimitsResponse getMembershipLimits(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.getRole() != UserRole.STUDENT) {
            throw new BusinessException("Only students can access membership limits");
        }

        String type = user.getMembershipType() == null ? "FREE" : user.getMembershipType();
        boolean isMember = "MEMBER".equals(type);

        int weeklyPostsUsed = refreshDiscussionUsageWindow(user).used();
        int resubmissionsUsed = 0;
        OffsetDateTime resetsAt = nextMondayStartUtc();

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

        int resubmissionLimit = 2;

        return new MembershipLimitsResponse(
                new MembershipLimitsResponse.LimitItem(
                        weeklyPostsUsed,
                        WEEKLY_POST_LIMIT,
                        Math.max(WEEKLY_POST_LIMIT - weeklyPostsUsed, 0),
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

    @Transactional
    public DiscussionPostingStatus getDiscussionPostingStatus(User user) {
        if (user.getRole() == UserRole.INSTRUCTOR) {
            return new DiscussionPostingStatus(false, 0, null);
        }

        String type = user.getMembershipType() == null ? "FREE" : user.getMembershipType();
        boolean isMember = "MEMBER".equals(type);
        int used = refreshDiscussionUsageWindow(user).used();
        return new DiscussionPostingStatus(isMember, used, isMember ? null : WEEKLY_POST_LIMIT);
    }

    @Transactional
    public DiscussionPostingStatus registerDiscussionContribution(User user) {
        DiscussionPostingStatus postingStatus = getDiscussionPostingStatus(user);
        if (postingStatus.member() || postingStatus.limit() == null) {
            return postingStatus;
        }

        int nextUsed = postingStatus.used() + 1;
        user.setWeeklyDiscussionPostsUsed(nextUsed);
        userRepository.save(user);
        return new DiscussionPostingStatus(false, nextUsed, postingStatus.limit());
    }

    private WeeklyDiscussionUsage refreshDiscussionUsageWindow(User user) {
        LocalDateTime currentWeekStart = currentWeekStartUtc();
        LocalDateTime storedWeekStart = user.getDiscussionWeekStart();

        if (storedWeekStart == null) {
            int currentUsage = countCurrentWeekUsage(user, currentWeekStart);
            user.setDiscussionWeekStart(currentWeekStart);
            user.setWeeklyDiscussionPostsUsed(currentUsage);
            userRepository.save(user);
            return new WeeklyDiscussionUsage(currentUsage);
        }

        if (!storedWeekStart.equals(currentWeekStart)) {
            user.setDiscussionWeekStart(currentWeekStart);
            user.setWeeklyDiscussionPostsUsed(0);
            userRepository.save(user);
            return new WeeklyDiscussionUsage(0);
        }

        int used = user.getWeeklyDiscussionPostsUsed() == null ? 0 : user.getWeeklyDiscussionPostsUsed();
        return new WeeklyDiscussionUsage(used);
    }

    private int countCurrentWeekUsage(User user, LocalDateTime weekStart) {
        LocalDateTime weekEnd = weekStart.plusWeeks(1);
        long postCount = postRepository.countByAuthorAndCreatedAtBetween(user, weekStart, weekEnd);
        long replyCount = replyRepository.countByAuthorAndCreatedAtBetween(user, weekStart, weekEnd);
        return Math.toIntExact(postCount + replyCount);
    }

    private LocalDateTime currentWeekStartUtc() {
        LocalDate currentUtcDate = OffsetDateTime.now(clock)
                .withOffsetSameInstant(ZoneOffset.UTC)
                .toLocalDate();
        return currentUtcDate
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .atStartOfDay();
    }

    private OffsetDateTime nextMondayStartUtc() {
        LocalDate currentUtcDate = OffsetDateTime.now(clock)
                .withOffsetSameInstant(ZoneOffset.UTC)
                .toLocalDate();
        return currentUtcDate
                .with(TemporalAdjusters.next(DayOfWeek.MONDAY))
                .atStartOfDay()
                .atOffset(ZoneOffset.UTC);
    }

    public record DiscussionPostingStatus(boolean member, int used, Integer limit) {
    }

    private record WeeklyDiscussionUsage(int used) {
    }
}
