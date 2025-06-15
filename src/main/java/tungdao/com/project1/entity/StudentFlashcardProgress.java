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

    @Enumerated(EnumType.STRING)
    @Column(name = "mastery_level")
    private MasteryLevel masteryLevel = MasteryLevel.NEW;

    @Column(name = "last_reviewed")
    private LocalDateTime lastReviewed;

    @Column(name = "next_review_date")
    private LocalDateTime nextReviewDate;

    @Column(name = "repetition_count")
    private Integer repetitionCount = 0;

    @Column(name = "ease_factor", precision = 4, scale = 2)
    private BigDecimal easeFactor = new BigDecimal("2.50");

    // ===== CÁC CỘT MỚI THÊM =====
    @Column(name = "total_reviews")
    private Integer totalReviews = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_difficulty_rating")
    private DifficultyRating lastDifficultyRating;

    @PrePersist
    protected void onCreate() {
        if (lastReviewed == null) lastReviewed = LocalDateTime.now();
        if (repetitionCount == null) repetitionCount = 0;
        if (easeFactor == null) easeFactor = new BigDecimal("2.50");
        if (totalReviews == null) totalReviews = 0;
        if (masteryLevel == null) masteryLevel = MasteryLevel.NEW;
    }

    // Enum cho mastery level
    public enum MasteryLevel {
        NEW, LEARNING, REVIEW, MASTERED
    }

    // Enum cho difficulty rating (tương ứng với 4 nút trong UI)
    public enum DifficultyRating {
        EASY,     // Dễ - 7 ngày sau mới xuất hiện
        MEDIUM,   // Trung bình - 3 ngày sau
        HARD,     // Khó - 1 ngày sau
        AGAIN     // Lại - xuất hiện ngay lập tức
    }
}