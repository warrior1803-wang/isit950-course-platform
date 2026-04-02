package com.learningplatform.lms.enrolment.entity;

import com.learningplatform.lms.common.entity.BaseEntity;
import com.learningplatform.lms.common.enums.EnrolmentStatus;
import com.learningplatform.lms.course.entity.Course;
import com.learningplatform.lms.user.entity.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "enrolments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_enrolments_student_course", columnNames = {"student_id", "course_id"})
        }
)
public class Enrolment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(name = "enrolment_status", nullable = false, length = 50)
    private EnrolmentStatus enrolmentStatus;

    @Column(name = "enrolled_at", nullable = false)
    private LocalDateTime enrolledAt;

    public Enrolment() {
    }

    @PrePersist
    protected void onEnrol() {
        if (this.enrolledAt == null) {
            this.enrolledAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public EnrolmentStatus getEnrolmentStatus() {
        return enrolmentStatus;
    }

    public void setEnrolmentStatus(EnrolmentStatus enrolmentStatus) {
        this.enrolmentStatus = enrolmentStatus;
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(LocalDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
    }
}