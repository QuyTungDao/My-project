package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "test_score_mapping")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestScoreMapping {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "test_type", nullable = false)
    private TestScoreMappingType testType;

    @Column(name = "correct_answers_min", nullable = false)
    private Integer correctAnswersMin;

    @Column(name = "correct_answers_max", nullable = false)
    private Integer correctAnswersMax;

    @Column(name = "ielts_score", nullable = false, precision = 3, scale = 1)
    private BigDecimal ieltsScore;
}