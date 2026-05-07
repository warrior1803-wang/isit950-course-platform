package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Course;
import com.learningplatform.backend.model.Reply;
import com.learningplatform.backend.model.Post;
import com.learningplatform.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReplyRepository extends JpaRepository<Reply, Long> {

    List<Reply> findByPostOrderByCreatedAtAsc(Post post);

    long countByAuthorAndPostCourse(User author, Course course);

    long countByAuthorAndCreatedAtBetween(User author, LocalDateTime start, LocalDateTime end);

    Optional<Reply> findTopByAuthorAndPostCourseOrderByCreatedAtDesc(User author, Course course);

    @Modifying
    @Transactional
    void deleteByPost(Post post);
}
