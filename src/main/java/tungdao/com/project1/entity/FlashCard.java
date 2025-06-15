package tungdao.com.project1.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "flashcards")
@Data
public class FlashCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "flashcard_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "creator_id")
    private User creator;

    @Column(nullable = false, length = 50)
    private String word;

    @Column(nullable = false)
    private String meaning;

    @Column(name = "example_sentence", columnDefinition = "TEXT")
    private String exampleSentence;

    @Column(columnDefinition = "TEXT")
    private String context;

    @Column(length = 100)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level")
    private DifficultyLevel difficultyLevel;

    // ===== CÁC CỘT MỚI THÊM =====
    @Column(name = "pronunciation")
    private String pronunciation; // Phiên âm IPA

    @Enumerated(EnumType.STRING)
    @Column(name = "word_type")
    private WordType wordType; // Loại từ

    @Column(columnDefinition = "TEXT")
    private String synonyms; // Từ đồng nghĩa

    @Column(name = "set_name", length = 100)
    private String setName; // Tên bộ thẻ

    @Column(name = "is_public")
    private Boolean isPublic = false; // Có công khai không

    @Column(name = "is_active")
    private Boolean isActive = true; // Có đang hoạt động không

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "flashcard", cascade = CascadeType.ALL)
    @JsonIgnore
    private Set<StudentFlashcardProgress> progressRecords = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isPublic == null) isPublic = false;
        if (isActive == null) isActive = true;
        if (difficultyLevel == null) difficultyLevel = DifficultyLevel.MEDIUM;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Enum cho difficulty level
    public enum DifficultyLevel {
        EASY, MEDIUM, HARD
    }

    // Enum cho word type
    public enum WordType {
        NOUN, VERB, ADJECTIVE, ADVERB, PREPOSITION,
        CONJUNCTION, PRONOUN, PHRASE, IDIOM
    }
}