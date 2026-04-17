package com.learningplatform.backend.service;

import com.learningplatform.backend.common.exception.BusinessException;
import com.learningplatform.backend.common.exception.NotFoundException;
import com.learningplatform.backend.dto.AnnouncementResponse;
import com.learningplatform.backend.dto.AssignmentListResponse;
import com.learningplatform.backend.dto.PostRequest;
import com.learningplatform.backend.dto.PostResponse;
import com.learningplatform.backend.dto.ReplyRequest;
import com.learningplatform.backend.dto.ReplyResponse;
import com.learningplatform.backend.dto.SubmissionSummaryResponse;
import com.learningplatform.backend.dto.UserSummaryResponse;
import com.learningplatform.backend.model.Announcement;
import com.learningplatform.backend.model.Assignment;
import com.learningplatform.backend.model.Course;
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

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseContentService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrolmentRepository enrolmentRepository;
    private final AnnouncementRepository announcementRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final PostRepository postRepository;
    private final ReplyRepository replyRepository;

    public List<AnnouncementResponse> getAnnouncements(Long courseId, String userEmail) {
        AccessContext context = requireCourseAccess(courseId, userEmail);
        return announcementRepository.findByCourseOrderByCreatedAtDesc(context.course()).stream()
                .map(this::toAnnouncementResponse)
                .toList();
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

        Post post = new Post();
        post.setCourse(context.course());
        post.setAuthor(context.user());
        post.setTitle(title);
        post.setBody(body);

        return toPostResponse(postRepository.save(post));
    }

    public ReplyResponse createReply(Long postId, ReplyRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        requireCourseAccess(post.getCourse().getId(), userEmail);

        String body = safe(request.getBody());
        if (body.isBlank()) {
            throw new BusinessException("Reply body is required");
        }

        Reply reply = new Reply();
        reply.setPost(post);
        reply.setAuthor(user);
        reply.setBody(body);

        return toReplyResponse(replyRepository.save(reply));
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
                replies
        );
    }

    private ReplyResponse toReplyResponse(Reply reply) {
        return new ReplyResponse(
                reply.getId(),
                reply.getBody(),
                toUserSummary(reply.getAuthor()),
                reply.getCreatedAt()
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

    private record AccessContext(User user, Course course) {
    }
}
