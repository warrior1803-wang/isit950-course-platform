package com.learningplatform.backend.model;

import com.learningplatform.backend.model.enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
@Getter
@Setter
@NoArgsConstructor
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    private String filename;

    @Column(name = "answers_json", columnDefinition = "TEXT")
    private String answersJson;

    @Column(name = "breakdown_json", columnDefinition = "TEXT")
    private String breakdownJson;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Enumerated(EnumType.STRING)
    private SubmissionStatus status;

    @Column(name = "overridden_score")
    private Integer overriddenScore;

    @Column(name = "overridden_by")
    private String overriddenBy;

    @Column(name = "override_reason", columnDefinition = "TEXT")
    private String overrideReason;

    @PrePersist
    public void prePersist() {
        this.submittedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = SubmissionStatus.SUBMITTED;
        }
    }
}