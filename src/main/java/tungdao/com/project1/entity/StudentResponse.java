package tungdao.com.project1.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_responses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "response_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "attempt_id", nullable = false)
    @JsonBackReference("attempt-responses")
    private TestAttempt attempt;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    @JsonBackReference("student-responses")
    private User student;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    @JsonBackReference("question-responses")
    private Question question;

    @Column(name = "response_text", columnDefinition = "TEXT")
    private String responseText;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "auto_score", precision = 3, scale = 1)
    private BigDecimal autoScore;

    @Column(name = "manual_score", precision = 3, scale = 1)
    private BigDecimal manualScore;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @ManyToOne
    @JoinColumn(name = "grader_id")
    private User grader;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "feedback_given_at")
    private LocalDateTime feedbackGivenAt;

    @OneToOne(mappedBy = "response", cascade = CascadeType.ALL)
    private SpeakingWritingCriteriaScore criteriaScore;

    @PrePersist
    protected void onCreate() {
        startTime = startTime == null ? LocalDateTime.now() : startTime;
    }
}