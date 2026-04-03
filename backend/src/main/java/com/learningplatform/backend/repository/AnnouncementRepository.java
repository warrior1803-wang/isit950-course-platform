package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
}