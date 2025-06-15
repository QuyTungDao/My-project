package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(name = "skill_type", nullable = false)
    private SkillProgressType skillType;

    @Column(name = "current_band_score", precision = 3, scale = 1)
    private BigDecimal currentBandScore;

    @Column(name = "target_band_score", precision = 3, scale = 1)
    private BigDecimal targetBandScore;

    @Column(name = "tests_completed")
    private Integer testsCompleted;

    @Column(name = "last_test_date")
    private LocalDateTime lastTestDate;

    @Column(name = "improvement_rate", precision = 4, scale = 2)
    private BigDecimal improvementRate;

    // ===== CÁC CỘT MỚI CHO FLASHCARDS =====
    @Column(name = "current_study_streak")
    private Integer currentStudyStreak = 0; // Chuỗi ngày học hiện tại

    @Column(name = "longest_study_streak")
    private Integer longestStudyStreak = 0; // Chuỗi dài nhất

    @Column(name = "total_flashcards_learned")
    private Integer totalFlashcardsLearned = 0; // Tổng số đã học

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        currentBandScore = currentBandScore == null ? new BigDecimal("0.0") : currentBandScore;
        targetBandScore = targetBandScore == null ? new BigDecimal("0.0") : targetBandScore;
        testsCompleted = testsCompleted == null ? 0 : testsCompleted;
        improvementRate = improvementRate == null ? new BigDecimal("0.00") : improvementRate;

        // Flashcard fields
        if (currentStudyStreak == null) currentStudyStreak = 0;
        if (longestStudyStreak == null) longestStudyStreak = 0;
        if (totalFlashcardsLearned == null) totalFlashcardsLearned = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Enum cho skill types (đã bổ sung FLASHCARDS)
    public enum SkillProgressType {
        LISTENING, READING, WRITING, SPEAKING, OVERALL, FLASHCARDS
    }
}