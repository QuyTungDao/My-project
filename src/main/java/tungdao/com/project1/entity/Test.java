package tungdao.com.project1.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tests")
@Getter
@Setter
@Data
@ToString(exclude = {"creator", "readingPassages", "listeningAudios", "questions", "attempts"})
@EqualsAndHashCode(exclude = {"creator", "readingPassages", "listeningAudios", "questions", "attempts"})
@NoArgsConstructor
@AllArgsConstructor
public class Test {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "test_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "creator_id")
    @JsonBackReference("user-tests")
    private User creator;

    @Column(name = "test_name", nullable = false, length = 100)
    private String testName;

    @Enumerated(EnumType.STRING)
    @Column(name = "test_type", nullable = false)
    private TestType testType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "passing_score", precision = 3, scale = 1)
    private BigDecimal passingScore;

    @Column(name = "is_practice")
    private Boolean isPractice;

    @Column(name = "is_published")
    private Boolean isPublished;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL)
    @JsonManagedReference("test-passages")
    private Set<ReadingPassage> readingPassages = new HashSet<>();

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL)
    @JsonManagedReference("test-audios")
    private Set<ListeningAudio> listeningAudios = new HashSet<>();

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL)
    @JsonManagedReference("test-questions")
    private Set<Question> questions = new HashSet<>();

    @OneToMany(mappedBy = "test")
    @JsonManagedReference("test-attempts")
    private Set<TestAttempt> attempts = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        passingScore = passingScore == null ? new BigDecimal("5.0") : passingScore;
        isPractice = isPractice == null ? Boolean.FALSE : isPractice;
        isPublished = isPublished == null ? Boolean.FALSE : isPublished;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}