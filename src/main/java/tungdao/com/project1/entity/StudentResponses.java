package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_responses")
@Data
public class StudentResponses {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "response_id")
    private Integer responseId;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne
    @JoinColumn(name = "question_id")
    private Question question;

    @ManyToOne
    @JoinColumn(name = "test_id")
    private Test test;

    @Column(name = "response_text")
    private String responseText;

    @Column(name = "auto_score")
    private Integer autoScore;

    @Column(name = "manual_score")
    private Integer manualScore;

    @Column(name = "feedback")
    private String feedback;

    @ManyToOne
    @JoinColumn(name = "grader_id")
    private User grader;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "feedback_given_at")
    private LocalDateTime feedbackGivenAt;
}
