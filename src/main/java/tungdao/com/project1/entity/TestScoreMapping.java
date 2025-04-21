package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Table(name = "test_score_mapping")
@IdClass(TestScoreMappingId.class)
@Data
public class TestScoreMapping {
    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "test_type", nullable = false)
    private TestType testType;

    @Id
    @Column(name = "correct_answers_min", nullable = false)
    private Integer correctAnswersMin;

    @Id
    @Column(name = "correct_answers_max", nullable = false)
    private Integer correctAnswersMax;

    @Column(name = "ielts_score", nullable = false)
    private BigDecimal ieltsScore;

    public enum TestType {
        listening, reading
    }
}