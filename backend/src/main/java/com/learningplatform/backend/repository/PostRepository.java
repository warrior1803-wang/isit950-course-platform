package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Course;
import com.learningplatform.backend.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByCourseOrderByCreatedAtDesc(Course course);
}
