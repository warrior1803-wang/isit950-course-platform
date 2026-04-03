package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Reply;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReplyRepository extends JpaRepository<Reply, Long> {
}