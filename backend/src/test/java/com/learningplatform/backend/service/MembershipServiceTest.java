package com.learningplatform.backend.service;

import com.learningplatform.backend.dto.MembershipLimitsResponse;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.UserRole;
import com.learningplatform.backend.repository.PostRepository;
import com.learningplatform.backend.repository.ReplyRepository;
import com.learningplatform.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class MembershipServiceTest {

    @Test
    void resetsWeeklyCounterWhenWeekRollsOverAndRegistersNextContribution() {
        LocalDate monday = LocalDate.of(2026, 5, 1)
                .with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
        Instant justBeforeMidnightSunday = monday.atStartOfDay().minusMinutes(1).toInstant(ZoneOffset.UTC);
        Instant justAfterMidnightMonday = monday.atStartOfDay().plusMinutes(1).toInstant(ZoneOffset.UTC);

        User user = freeStudent();
        user.setDiscussionWeekStart(monday.minusWeeks(1).atStartOfDay());
        user.setWeeklyDiscussionPostsUsed(MembershipService.WEEKLY_POST_LIMIT);

        UserRepository userRepository = userRepositoryFor(user);
        PostRepository postRepository = countRepository(PostRepository.class, 0L);
        ReplyRepository replyRepository = countRepository(ReplyRepository.class, 0L);

        MembershipService sundayService = new MembershipService(
                userRepository,
                postRepository,
                replyRepository,
                Clock.fixed(justBeforeMidnightSunday, ZoneOffset.UTC)
        );
        MembershipService mondayService = new MembershipService(
                userRepository,
                postRepository,
                replyRepository,
                Clock.fixed(justAfterMidnightMonday, ZoneOffset.UTC)
        );

        MembershipService.DiscussionPostingStatus sundayStatus = sundayService.getDiscussionPostingStatus(user);
        assertEquals(MembershipService.WEEKLY_POST_LIMIT, sundayStatus.used());

        MembershipService.DiscussionPostingStatus mondayStatus = mondayService.getDiscussionPostingStatus(user);
        assertEquals(0, mondayStatus.used());
        assertEquals(monday.atStartOfDay(), user.getDiscussionWeekStart());

        MembershipService.DiscussionPostingStatus afterPost = mondayService.registerDiscussionContribution(user);
        assertEquals(1, afterPost.used());
        assertEquals(1, user.getWeeklyDiscussionPostsUsed());
    }

    @Test
    void returnsNextMondayMidnightUtcInMembershipLimits() {
        LocalDate wednesday = LocalDate.of(2026, 5, 13);
        Instant now = wednesday.atTime(10, 30).toInstant(ZoneOffset.UTC);
        Clock clock = Clock.fixed(now, ZoneOffset.UTC);

        User user = freeStudent();
        user.setDiscussionWeekStart(wednesday.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay());
        user.setWeeklyDiscussionPostsUsed(3);

        MembershipService service = new MembershipService(
                userRepositoryFor(user),
                countRepository(PostRepository.class, 0L),
                countRepository(ReplyRepository.class, 0L),
                clock
        );

        MembershipLimitsResponse response = service.getMembershipLimits("student@example.com");

        assertNotNull(response.getPosts().getResetsAt());
        assertEquals("2026-05-18T00:00Z", response.getPosts().getResetsAt().toString());
    }

    private User freeStudent() {
        User user = new User();
        user.setId(1L);
        user.setName("Student Example");
        user.setEmail("student@example.com");
        user.setRole(UserRole.STUDENT);
        user.setMembershipType("FREE");
        user.setDiscussionWeekStart(LocalDateTime.of(2026, 5, 11, 0, 0));
        user.setWeeklyDiscussionPostsUsed(0);
        return user;
    }

    private UserRepository userRepositoryFor(User user) {
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class[]{UserRepository.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "findByEmail" -> Optional.of(user);
                    case "save" -> args[0];
                    case "toString" -> "UserRepositoryProxy";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> unsupported(method.getName());
                }
        );
    }

    @SuppressWarnings("unchecked")
    private <T> T countRepository(Class<T> type, long count) {
        return (T) Proxy.newProxyInstance(
                type.getClassLoader(),
                new Class[]{type},
                (proxy, method, args) -> switch (method.getName()) {
                    case "countByAuthorAndCreatedAtBetween" -> count;
                    case "toString" -> type.getSimpleName() + "Proxy";
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> unsupported(method.getName());
                }
        );
    }

    private Object unsupported(String methodName) {
        throw new UnsupportedOperationException("Unexpected repository call: " + methodName);
    }
}
