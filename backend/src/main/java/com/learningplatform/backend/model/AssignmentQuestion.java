package com.learningplatform.backend.model;

import com.learningplatform.backend.model.enums.QuestionType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "assignment_questions")
@Getter
@Setter
@NoArgsConstructor
public class AssignmentQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 前端传来的 question id，例如 "q1"
    @Column(name = "question_key", nullable = false)
    private String questionKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(nullable = false)
    private Integer points;

    // MCQ 的 options，用 JSON 字符串保存
    @Column(name = "options_json", columnDefinition = "TEXT")
    private String optionsJson;

    // 只存在服务端，不返回给学生
    @Column(name = "correct_option")
    private Integer correctOption;

    // 只存在服务端，不返回给学生
    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;
}