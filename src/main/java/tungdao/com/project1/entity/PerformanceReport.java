package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "performance_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne
    @JoinColumn(name = "attempt_id", nullable = false)
    private TestAttempt attempt;

    @ManyToOne
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @Column(name = "listening_score", precision = 3, scale = 1)
    private BigDecimal listeningScore;

    @Column(name = "reading_score", precision = 3, scale = 1)
    private BigDecimal readingScore;

    @Column(name = "speaking_score", precision = 3, scale = 1)
    private BigDecimal speakingScore;

    @Column(name = "writing_score", precision = 3, scale = 1)
    private BigDecimal writingScore;

    @Column(name = "total_score", precision = 3, scale = 1)
    private BigDecimal totalScore;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String weaknesses;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @Column(name = "is_final")
    private Boolean isFinal;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @PrePersist
    protected void onCreate() {
        generatedAt = LocalDateTime.now();
        isFinal = isFinal == null ? Boolean.FALSE : isFinal;
    }
}