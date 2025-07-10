package tungdao.com.project1.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class SpeakingWritingResultDTO {
    // Basic test attempt info
    private Integer attemptId;
    private Integer testId;
    private String testName;
    private String testType; // SPEAKING or WRITING

    // Student info
    private Integer studentId;
    private String studentName;
    private String studentEmail;

    // Timing info
    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;
    private Boolean isCompleted;

    // Overall scoring
    private BigDecimal overallScore;
    private String overallFeedback;
    private Map<String, Object> criteriaScores; // Map of criteria name to score

    // Performance summary
    private String performanceLevel; // Excellent, Good, Satisfactory, Needs Improvement
    private String performanceSummary;

    // Individual responses
    private List<ResponseDTO> responses;

    @Data
    public static class ResponseDTO {
        private Integer id;
        private Integer questionId;
        private Integer questionNumber; // Display number (1, 2, 3...)
        private String questionText;
        private String questionType;

        // Response content
        private String responseText;
        private String audioBase64;
        private Integer audioDuration; // in seconds
        private String audioFileType;
        private Long audioFileSize;

        // Individual scoring/feedback
        private BigDecimal manualScore;
        private Boolean isCorrect;
        private String feedback;
        private LocalDateTime feedbackGivenAt;

        // Helper methods
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

        public int getWordCount() {
            if (!hasTextResponse()) return 0;
            return responseText.trim().split("\\s+").length;
        }

        public String getFormattedDuration() {
            if (audioDuration == null || audioDuration <= 0) return "0:00";
            int minutes = audioDuration / 60;
            int seconds = audioDuration % 60;
            return String.format("%d:%02d", minutes, seconds);
        }
    }
}