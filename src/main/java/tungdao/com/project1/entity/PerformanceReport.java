package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "performance_reports")
@Data
public class PerformanceReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Integer reportId;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne
    @JoinColumn(name = "test_id")
    private Test test;

    @Column(name = "listening_score")
    private Integer listeningScore;

    @Column(name = "reading_score")
    private Integer readingScore;

    @Column(name = "speaking_score")
    private Integer speakingScore;

    @Column(name = "writing_score")
    private Integer writingScore;

    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "recommendations")
    private String recommendations;

    @Column(name = "generated_at", updatable = false)
    private LocalDateTime generatedAt;

    @Column(name = "is_final")
    private Boolean isFinal;

    @Column(name = "feedback")
    private String feedback;
}
