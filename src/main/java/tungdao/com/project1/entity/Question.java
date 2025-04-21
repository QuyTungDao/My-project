package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "questions")
@Data
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Integer questionId;

    @ManyToOne
    @JoinColumn(name = "test_id")
    private Test test;

    @Column(name = "question_text", nullable = false)
    private String questionText;

    @Column(name = "correct_answer")
    private String correctAnswer;

    @Column(name = "max_score", nullable = false)
    private Integer maxScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType;

    @Column(name = "options")
    private String options;

    @Column(name = "blank_answer")
    private String blankAnswer;

    @Enumerated(EnumType.STRING)
    @Column(name = "is_true_false_answer")
    private TrueFalseNotGiven isTrueFalseAnswer;

    @Column(name = "matching_answer")
    private String matchingAnswer;

    public enum QuestionType {
        mcq, fill_in_the_blank, true_false_not_given, short_answer, matching
    }

    public enum TrueFalseNotGiven {
        TRUE,FALSE,NOT_GIVEN
    }
}
