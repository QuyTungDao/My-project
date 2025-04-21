package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "flashcards")
@Data
public class FlashCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "flashcard_id")
    private Integer flashcardId;

    @ManyToOne
    @JoinColumn(name = "creator_id")
    private User creator;

    @Column(name = "word", nullable = false)
    private String word;

    @Column(name = "meaning", nullable = false)
    private String meaning;

    @Column(name = "example_sentence")
    private String exampleSentence;

    @Column(name = "context")
    private String context;

    @Column(name = "category")
    private String category;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
