package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_flashcard_progress")
@Data
public class StudentFlashcardProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Integer progressId;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne
    @JoinColumn(name = "flashcard_id")
    private FlashCard flashcard;

    @Column(name = "last_reviewed")
    private LocalDateTime lastReviewed;

    @Column(name = "next_review_date")
    private LocalDateTime nextReviewDate;

}
