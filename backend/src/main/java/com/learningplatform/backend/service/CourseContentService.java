package com.learningplatform.backend.service;

import com.learningplatform.backend.common.exception.PostLimitException;
import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.common.exception.NotFoundException;
import com.learningplatform.backend.dto.AnnouncementRequest;
import com.learningplatform.backend.dto.AnnouncementResponse;
import com.learningplatform.backend.dto.AssignmentListResponse;
import com.learningplatform.backend.dto.EnrolmentResponse;
import com.learningplatform.backend.dto.PostRequest;
import com.learningplatform.backend.dto.PostResponse;
import com.learningplatform.backend.dto.ReplyRequest;
import com.learningplatform.backend.dto.ReplyResponse;
import com.learningplatform.backend.dto.SubmissionSummaryResponse;
import com.learningplatform.backend.dto.UserSummaryResponse;
import com.learningplatform.backend.model.Announcement;
import com.learningplatform.backend.model.Assignment;
import com.learningplatform.backend.model.Course;
import com.learningplatform.backend.model.Enrolment;
import com.learningplatform.backend.model.Post;
import com.learningplatform.backend.model.Reply;
import com.learningplatform.backend.model.Submission;
import com.learningplatform.backend.model.User;
import com.learningplatform.backend.model.enums.UserRole;
import com.learningplatform.backend.repository.AnnouncementRepository;
import com.learningplatform.backend.repository.AssignmentRepository;
import com.learningplatform.backend.repository.CourseRepository;
import com.learningplatform.backend.repository.EnrolmentRepository;
import com.learningplatform.backend.repository.PostRepository;
import com.learningplatform.backend.repository.ReplyRepository;
import com.learningplatform.backend.repository.SubmissionRepository;
import com.learningplatform.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseContentService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrolmentRepository enrolmentRepository;
    private final AnnouncementRepository announcementRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final PostRepository postRepository;
    private final ReplyRepository replyRepository;
    private final MembershipService membershipService;


    public List<AnnouncementResponse> getAnnouncements(Long courseId, String userEmail) {
        AccessContext context = requireCourseAccess(courseId, userEmail);
        return announcementRepository.findByCourseOrderByCreatedAtDesc(context.course()).stream()
                .map(this::toAnnouncementResponse)
                .toList();
    }

    public AnnouncementResponse createAnnouncement(Long courseId, AnnouncementRequest request, String userEmail) {
        AccessContext context = requireInstructorOwnership(courseId, userEmail);
        String title = safe(request.getTitle());
        String body = safe(request.getBody());

        if (title.isBlank()) {
            throw new BusinessException("Announcement title is required");
        }
        if (body.isBlank()) {
            throw new BusinessException("Announcement body is required");
        }

        Announcement announcement = new Announcement();
        announcement.setCourse(context.course());
        announcement.setAuthor(context.user());
        announcement.setTitle(title);
        announcement.setBody(body);

        return toAnnouncementResponse(announcementRepository.save(announcement));
    }

    public AnnouncementResponse updateAnnouncement(
            Long courseId,
            Long announcementId,
            AnnouncementRequest request,
            String userEmail
    ) {
        requireInstructorOwnership(courseId, userEmail);
        String title = safe(request.getTitle());
        String body = safe(request.getBody());

        if (title.isBlank()) {
            throw new BusinessException("Announcement title is required");
        }
        if (body.isBlank()) {
            throw new BusinessException("Announcement body is required");
        }

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new NotFoundException("Announcement not found"));

        if (!announcement.getCourse().getId().equals(courseId)) {
            throw new NotFoundException("Announcement not found");
        }

        announcement.setTitle(title);
        announcement.setBody(body);
        return toAnnouncementResponse(announcementRepository.save(announcement));
    }

    public List<AssignmentListResponse> getAssignments(Long courseId, String userEmail) {
        AccessContext context = requireCourseAccess(courseId, userEmail);
        return assignmentRepository.findByCourseOrderByDueDateAsc(context.course()).stream()
                .map(assignment -> toAssignmentListResponse(assignment, context.user()))
                .toList();
    }

    public List<PostResponse> getPosts(Long courseId, String userEmail) {
        AccessContext context = requireCourseAccess(courseId, userEmail);
        return postRepository.findByCourseOrderByCreatedAtDesc(context.course()).stream()
                .map(this::toPostResponse)
                .toList();
    }

    public PostResponse getPost(Long courseId, Long postId, String userEmail) {
        requireCourseAccess(courseId, userEmail);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (!post.getCourse().getId().equals(courseId)) {
            throw new NotFoundException("Post not found");
        }

        return toPostResponse(post);
    }

    public PostResponse createPost(Long courseId, PostRequest request, String userEmail) {
        AccessContext context = requireCourseAccess(courseId, userEmail);
        String title = safe(request.getTitle());
        String body = safe(request.getBody());

        if (title.isBlank()) {
            throw new BusinessException("Post title is required");
        }
        if (body.isBlank()) {
            throw new BusinessException("Post body is required");
        }

        MembershipService.DiscussionPostingStatus postingStatus = enforceDiscussionPostLimit(context.user());

        Post post = new Post();
        post.setCourse(context.course());
        post.setAuthor(context.user());
        post.setTitle(title);
        post.setBody(body);

        PostResponse response = toPostResponse(postRepository.save(post));
        MembershipService.DiscussionPostingStatus updatedPostingStatus =
                membershipService.registerDiscussionContribution(context.user());
        return attachDiscussionUsage(response, updatedPostingStatus);
    }

    public ReplyResponse createReply(Long courseId, Long postId, ReplyRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (!post.getCourse().getId().equals(courseId)) {
            throw new NotFoundException("Post not found");
        }

        requireCourseAccess(courseId, userEmail);

        String body = safe(request.getBody());
        if (body.isBlank()) {
            throw new BusinessException("Reply body is required");
        }

        MembershipService.DiscussionPostingStatus postingStatus = enforceDiscussionPostLimit(user);

        Reply reply = new Reply();
        reply.setPost(post);
        reply.setAuthor(user);
        reply.setBody(body);

        ReplyResponse response = toReplyResponse(replyRepository.save(reply));
        MembershipService.DiscussionPostingStatus updatedPostingStatus =
                membershipService.registerDiscussionContribution(user);
        return attachDiscussionUsage(response, updatedPostingStatus);
    }

    public void deletePost(Long courseId, Long postId, String userEmail) {
        AccessContext context = requireCourseAccess(courseId, userEmail);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (!post.getCourse().getId().equals(courseId)) {
            throw new NotFoundException("Post not found");
        }

        if (!canManageDiscussionContent(context.user(), context.course(), post.getAuthor().getId())) {
            throw new AccessDeniedException("Forbidden");
        }

        replyRepository.deleteByPost(post);
        postRepository.delete(post);
    }

    public void deleteReply(Long courseId, Long postId, Long replyId, String userEmail) {
        AccessContext context = requireCourseAccess(courseId, userEmail);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (!post.getCourse().getId().equals(courseId)) {
            throw new NotFoundException("Post not found");
        }

        Reply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new NotFoundException("Reply not found"));

        if (!reply.getPost().getId().equals(postId)) {
            throw new NotFoundException("Reply not found");
        }

        if (!canManageDiscussionContent(context.user(), context.course(), reply.getAuthor().getId())) {
            throw new AccessDeniedException("Forbidden");
        }

        replyRepository.delete(reply);
    }

    private AccessContext requireCourseAccess(Long courseId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        if (user.getRole() == UserRole.INSTRUCTOR) {
            if (!course.getInstructor().getId().equals(user.getId())) {
                throw new AccessDeniedException("You do not own this course");
            }
        } else if (user.getRole() == UserRole.STUDENT) {
            if (!enrolmentRepository.existsByStudentAndCourse(user, course)) {
                throw new AccessDeniedException("You are not enrolled in this course");
            }
        } else {
            throw new BusinessException("Invalid user role");
        }

        return new AccessContext(user, course);
    }

    private AccessContext requireInstructorOwnership(Long courseId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        if (user.getRole() != UserRole.INSTRUCTOR) {
            throw new AccessDeniedException("Only instructors can manage announcements");
        }
        if (!course.getInstructor().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not own this course");
        }

        return new AccessContext(user, course);
    }

    private AnnouncementResponse toAnnouncementResponse(Announcement announcement) {
        return new AnnouncementResponse(
                announcement.getId(),
                announcement.getTitle(),
                announcement.getBody(),
                toUserSummary(announcement.getAuthor()),
                announcement.getCreatedAt()
        );
    }

    private AssignmentListResponse toAssignmentListResponse(Assignment assignment, User user) {
        SubmissionSummaryResponse submissionSummary = null;
        if (user.getRole() == UserRole.STUDENT) {
            Submission submission = submissionRepository
                    .findTopByAssignmentAndStudentOrderBySubmittedAtDesc(assignment, user)
                    .orElse(null);
            if (submission != null) {
                submissionSummary = new SubmissionSummaryResponse(
                        submission.getId(),
                        submission.getFilename(),
                        submission.getSubmittedAt(),
                        submission.getScore(),
                        submission.getFeedback(),
                        submission.getStatus() != null ? submission.getStatus().name() : null
                );
            }
        }

        return new AssignmentListResponse(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getCreatedAt(),
                assignment.getDueDate(),
                assignment.getMaxScore(),
                assignment.getType(),
                submissionSummary
        );
    }

    private PostResponse toPostResponse(Post post) {
        List<ReplyResponse> replies = replyRepository.findByPostOrderByCreatedAtAsc(post).stream()
                .map(this::toReplyResponse)
                .toList();

        return new PostResponse(
                post.getId(),
                post.getTitle(),
                post.getBody(),
                toUserSummary(post.getAuthor()),
                post.getCreatedAt(),
                replies,
                null,
                null
        );
    }

    private ReplyResponse toReplyResponse(Reply reply) {
        return new ReplyResponse(
                reply.getId(),
                reply.getBody(),
                toUserSummary(reply.getAuthor()),
                reply.getCreatedAt(),
                null,
                null
        );
    }

    private UserSummaryResponse toUserSummary(User user) {
        return new UserSummaryResponse(user.getId(), user.getName(), user.getRole());
    }

    private String safe(String... values) {
        for (String value : values) {
            if (value != null) {
                return value.trim();
            }
        }
        return "";
    }

    private boolean canManageDiscussionContent(User currentUser, Course course, Long authorId) {
        if (currentUser.getRole() == UserRole.INSTRUCTOR) {
            return course.getInstructor().getId().equals(currentUser.getId());
        }
        return currentUser.getId().equals(authorId);
    }

    private MembershipService.DiscussionPostingStatus enforceDiscussionPostLimit(User user) {
        if (user.getRole() == UserRole.INSTRUCTOR) {
            return membershipService.getDiscussionPostingStatus(user);
        }

        MembershipService.DiscussionPostingStatus postingStatus = membershipService.getDiscussionPostingStatus(user);
        if (!postingStatus.member() && postingStatus.limit() != null && postingStatus.used() >= postingStatus.limit()) {
            throw new PostLimitException();
        }
        return postingStatus;
    }

    private PostResponse attachDiscussionUsage(
            PostResponse response,
            MembershipService.DiscussionPostingStatus postingStatus
    ) {
        if (postingStatus.limit() == null) {
            return response;
        }
        response.setWeeklyPostsUsed(postingStatus.used());
        response.setWeeklyPostsLimit(postingStatus.limit());
        return response;
    }

    private ReplyResponse attachDiscussionUsage(
            ReplyResponse response,
            MembershipService.DiscussionPostingStatus postingStatus
    ) {
        if (postingStatus.limit() == null) {
            return response;
        }
        response.setWeeklyPostsUsed(postingStatus.used());
        response.setWeeklyPostsLimit(postingStatus.limit());
        return response;
    }

    private record AccessContext(User user, Course course) {
    }

    public boolean deleteAnnouncement(Long courseId, Long announcementId, String userEmail) {
        AccessContext context = requireInstructorOwnership(courseId, userEmail);

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElse(null);

        if (announcement == null || !announcement.getCourse().getId().equals(courseId)) {
            return false;
        }

        announcementRepository.delete(announcement);
        return true;
    }

    public List<EnrolmentResponse> getEnrolments(Long courseId, String instructorEmail) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (!course.getInstructor().getEmail().equals(instructorEmail)) {
            throw new RuntimeException("Forbidden");
        }

        List<Enrolment> enrolments = enrolmentRepository.findByCourseId(courseId);

        return enrolments.stream()
                .map(enrolment -> {
                    User student = enrolment.getStudent();

                    String membershipType = student.getMembershipType() == null
                            ? "FREE"
                            : student.getMembershipType();

                    return new EnrolmentResponse(
                            student.getId(),
                            student.getName(),
                            student.getEmail(),
                            new EnrolmentResponse.Membership(membershipType)
                    );
                })
                .toList();
    }
}
