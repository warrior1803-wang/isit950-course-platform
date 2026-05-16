package com.learningplatform.backend.model;

import com.learningplatform.backend.model.enums.CollabMode;
import com.learningplatform.backend.model.enums.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @ElementCollection
    @CollectionTable(
            name = "user_skills",
            joinColumns = @JoinColumn(name = "user_id")
    )
    @Column(name = "skill")
    private List<String> skills = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "collab_mode")
    private CollabMode collabMode;

    @Column(name = "availability")
    private String availability;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "membership_type")
    private String membershipType;

    @Column(name = "membership_since")
    private LocalDateTime membershipSince;

    @Column(name = "membership_expires_at")
    private LocalDateTime membershipExpiresAt;

    @Column(name = "membership_plan")
    private String membershipPlan;

    @Column(name = "discussion_week_start")
    private LocalDateTime discussionWeekStart;

    @Column(name = "weekly_discussion_posts_used")
    private Integer weeklyDiscussionPostsUsed;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.weeklyDiscussionPostsUsed == null) {
            this.weeklyDiscussionPostsUsed = 0;
        }
    }
}
