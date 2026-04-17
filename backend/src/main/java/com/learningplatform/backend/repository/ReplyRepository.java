package com.learningplatform.backend.repository;

import com.learningplatform.backend.model.Reply;
import com.learningplatform.backend.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReplyRepository extends JpaRepository<Reply, Long> {

    List<Reply> findByPostOrderByCreatedAtAsc(Post post);
}
