package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Course;
import com.learningplatform.backend.model.Post;
import com.learningplatform.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByCourseOrderByCreatedAtDesc(Course course);

    long countByAuthorAndCourse(User author, Course course);

    long countByAuthorAndCreatedAtBetween(User author, LocalDateTime start, LocalDateTime end);

    Optional<Post> findTopByAuthorAndCourseOrderByCreatedAtDesc(User author, Course course);
}
