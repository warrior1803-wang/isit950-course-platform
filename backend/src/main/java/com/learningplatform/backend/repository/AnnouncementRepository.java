package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Announcement;
import com.learningplatform.backend.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findByCourseOrderByCreatedAtDesc(Course course);
}
