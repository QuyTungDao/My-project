package tungdao.com.project1.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "listening_audio")
@Getter
@Setter
@ToString(exclude = {"test", "questions"})
@EqualsAndHashCode(exclude = {"test", "questions"})
@NoArgsConstructor
@AllArgsConstructor
public class ListeningAudio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audio_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @Column(nullable = false)
    private String title;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type")
    private AudioFileType fileType;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Enumerated(EnumType.STRING)
    private ListeningSection section;

    @Column(name = "order_in_test")
    private Integer orderInTest;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "audio")
    private Set<Question> questions = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        fileType = fileType == null ? AudioFileType.MP3 : fileType;
        orderInTest = orderInTest == null ? 1 : orderInTest;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
