package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "speaking_writing_criteria_scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpeakingWritingCriteriaScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "criteria_score_id")
    private Integer id;

    @OneToOne
    @JoinColumn(name = "response_id", nullable = false)
    private StudentResponse response;

    @Column(name = "task_achievement", precision = 3, scale = 1)
    private BigDecimal taskAchievement;

    @Column(name = "coherence_cohesion", precision = 3, scale = 1)
    private BigDecimal coherenceCohesion;

    @Column(name = "lexical_resource", precision = 3, scale = 1)
    private BigDecimal lexicalResource;

    @Column(name = "grammatical_accuracy", precision = 3, scale = 1)
    private BigDecimal grammaticalAccuracy;

    @Column(name = "fluency_pronunciation", precision = 3, scale = 1)
    private BigDecimal fluencyPronunciation;

    @Column(name = "marker_comments", columnDefinition = "TEXT")
    private String markerComments;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;

    @PrePersist
    protected void onCreate() {
        gradedAt = LocalDateTime.now();
    }
}