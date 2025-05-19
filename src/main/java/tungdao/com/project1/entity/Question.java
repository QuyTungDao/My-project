package tungdao.com.project1.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "questions")
@Getter
@Setter
@ToString(exclude = {"test", "passage", "audio", "correctAnswer", "responses"})
@EqualsAndHashCode(exclude = {"test", "passage", "audio", "correctAnswer", "responses"})
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "test_id", nullable = false)
    @JsonIgnoreProperties({"questions", "readingPassages", "listeningAudios", "attempts"})
    private Test test;

    @ManyToOne
    @JoinColumn(name = "passage_id")
    @JsonIgnoreProperties({"questions"})
    private ReadingPassage passage;

    @ManyToOne
    @JoinColumn(name = "audio_id")
    @JsonIgnoreProperties({"questions"})
    private ListeningAudio audio;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType;

    @Column(columnDefinition = "TEXT")
    private String options;

    @Column(length = 100)
    private String section;

    @Column(name = "order_in_test")
    private Integer orderInTest;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "question", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"questions"})
    private CorrectAnswer correctAnswer;

    @OneToMany(mappedBy = "question")
    private Set<StudentResponse> responses = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        orderInTest = orderInTest == null ? 0 : orderInTest;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
