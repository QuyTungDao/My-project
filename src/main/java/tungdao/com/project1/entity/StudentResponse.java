package tungdao.com.project1.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_responses")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "response_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "attempt_id", nullable = false)
    @JsonBackReference("attempt-responses")
    private TestAttempt attempt;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    @JsonBackReference("student-responses")
    private User student;

    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    @JsonBackReference("question-responses")
    private Question question;

    @Column(name = "response_text", columnDefinition = "TEXT")
    private String responseText;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "auto_score", precision = 3, scale = 1)
    private BigDecimal autoScore;

    @Column(name = "manual_score", precision = 3, scale = 1)
    private BigDecimal manualScore;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @ManyToOne
    @JoinColumn(name = "grader_id")
    private User grader;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "audio_file_type", length = 10)
    private String audioFileType; // webm, mp3, wav

    @Column(name = "feedback_given_at")
    private LocalDateTime feedbackGivenAt;

    // ✅ ONLY fields that exist in actual DB
    @Enumerated(EnumType.STRING)
    @Column(name = "response_type")
    private ResponseType responseType = ResponseType.TEXT;

    @Column(name = "audio_base64", columnDefinition = "LONGTEXT")
    private String audioBase64;

    @Column(name = "audio_duration_seconds")
    private Integer audioDurationSeconds;

    @Column(name = "audio_mime_type", length = 50)
    private String audioMimeType;

    @Column(name = "word_count")
    private Integer wordCount;

    @Column(name = "audio_file_size")
    private Long audioFileSize;

    @PrePersist
    protected void onCreate() {
        startTime = startTime == null ? LocalDateTime.now() : startTime;
        if (responseType == null) {
            responseType = ResponseType.TEXT;
        }
    }

    public boolean hasTextResponse() {
        return responseText != null && !responseText.trim().isEmpty();
    }

    public boolean hasAudioResponse() {
        return audioBase64 != null && !audioBase64.trim().isEmpty();
    }

    public String getResponseType() {
        if (hasAudioResponse()) return "AUDIO";
        if (hasTextResponse()) return "TEXT";
        return "NONE";
    }

    public boolean requiresManualGrading() {
        // Speaking responses or Writing essays need manual grading
        return hasAudioResponse() ||
                (hasTextResponse() && question != null &&
                        (question.getQuestionType().toString().contains("WRITING") ||
                                question.getQuestionType().toString().contains("SPEAKING") ||
                                question.getQuestionType().toString().equals("ESSAY")));
    }
}

// ✅ Simple enum - no extra methods