package tungdao.com.project1.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "test_attempts")
@Data
public class TestAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attempt_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    @JsonBackReference("student-attempts")
    private User student;

    @ManyToOne
    @JoinColumn(name = "test_id", nullable = false)
    @JsonBackReference("test-attempts")
    private Test test;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "is_completed")
    private Boolean isCompleted;

    @Column(name = "total_score", precision = 3, scale = 1)
    private BigDecimal totalScore;

    @Column(name = "listening_score", precision = 3, scale = 1)
    private BigDecimal listeningScore;

    @Column(name = "reading_score", precision = 3, scale = 1)
    private BigDecimal readingScore;

    @Column(name = "writing_score", precision = 3, scale = 1)
    private BigDecimal writingScore;

    @Column(name = "speaking_score", precision = 3, scale = 1)
    private BigDecimal speakingScore;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL)
    @JsonManagedReference("attempt-responses")
    private Set<StudentResponse> responses = new HashSet<>();

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL)
    @JsonManagedReference("attempt-reports")
    private Set<PerformanceReport> reports = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        startTime = startTime == null ? LocalDateTime.now() : startTime;
        createdAt = LocalDateTime.now();
        isCompleted = isCompleted == null ? Boolean.FALSE : isCompleted;
    }
}
