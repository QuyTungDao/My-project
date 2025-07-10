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
        // Check if it's a subjective question type
        if (this.question != null && this.question.getQuestionType() != null) {
            QuestionType type = this.question.getQuestionType();

            // Writing and speaking questions require manual grading
            boolean isSubjectiveType = type == QuestionType.WRITING_TASK1_ACADEMIC ||
                    type == QuestionType.WRITING_TASK1_GENERAL ||
                    type == QuestionType.WRITING_TASK2 ||
                    type == QuestionType.ESSAY ||
                    type == QuestionType.SPEAKING_PART1 ||
                    type == QuestionType.SPEAKING_PART2 ||
                    type == QuestionType.SPEAKING_PART3 ||
                    type == QuestionType.SPEAKING_TASK;

            if (isSubjectiveType) {
                return true;
            }
        }

        // Audio responses require manual grading
        if (this.audioBase64 != null && !this.audioBase64.trim().isEmpty()) {
            return true;
        }

        return false;
    }

    /**
     * ✅ SAFE: Check if this response has been manually graded
     */
    public boolean isManuallyGraded() {
        return this.requiresManualGrading() && this.manualScore != null;
    }

    /**
     * ✅ SAFE: Get effective score (manual score if available, otherwise auto score)
     */
    public BigDecimal getEffectiveScore() {
        if (this.manualScore != null) {
            return this.manualScore;
        }

        // For objective questions, convert isCorrect to score
        if (this.isCorrect != null) {
            return this.isCorrect ? BigDecimal.valueOf(1.0) : BigDecimal.ZERO;
        }

        return BigDecimal.ZERO;
    }
}

// ✅ Simple enum - no extra methods