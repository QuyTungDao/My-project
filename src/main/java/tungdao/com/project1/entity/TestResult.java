package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_results")
@Data
public class TestResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "result_id")
    private Integer resultId;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @Column(name = "listening_correct_answers")
    private Integer listeningCorrectAnswers;

    @Column(name = "reading_correct_answers")
    private Integer readingCorrectAnswers;

    @Column(name = "listening_score")
    private BigDecimal listeningScore;

    @Column(name = "reading_score")
    private BigDecimal readingScore;

    @Column(name = "total_score")
    private BigDecimal totalScore;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
