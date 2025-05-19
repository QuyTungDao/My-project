package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "correct_answers")
@Getter
@Setter
@ToString(exclude = {"question"})
@EqualsAndHashCode(exclude = {"question"})
@NoArgsConstructor
@AllArgsConstructor
public class CorrectAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "answer_id")
    private Integer id;

    @OneToOne
    @JoinColumn(name = "question_id", nullable = false, unique = true)
    private Question question;

    @Column(name = "correct_answer_text", nullable = false, columnDefinition = "TEXT")
    private String correctAnswerText;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "alternative_answers", columnDefinition = "TEXT")
    private String alternativeAnswers;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
