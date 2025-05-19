package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_flashcard_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentFlashcardProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne
    @JoinColumn(name = "flashcard_id", nullable = false)
    private FlashCard flashcard;

    @Column(name = "last_reviewed")
    private LocalDateTime lastReviewed;

    @Column(name = "next_review_date")
    private LocalDateTime nextReviewDate;

    @Column(name = "repetition_count")
    private Integer repetitionCount;

    @Column(name = "ease_factor", precision = 4, scale = 2)
    private BigDecimal easeFactor;

    @PrePersist
    protected void onCreate() {
        lastReviewed = lastReviewed == null ? LocalDateTime.now() : lastReviewed;
        repetitionCount = repetitionCount == null ? 0 : repetitionCount;
        easeFactor = easeFactor == null ? new BigDecimal("2.5") : easeFactor;
    }
}