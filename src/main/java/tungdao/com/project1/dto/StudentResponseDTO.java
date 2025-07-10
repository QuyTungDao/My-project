package tungdao.com.project1.dto;


import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class StudentResponseDTO {
    private Integer id;
    private Integer questionId;
    private String questionText;
    private String responseText;
    private Boolean isCorrect;
    private String correctAnswer;
    private String questionType;
    private LocalDateTime submittedAt;
    private Integer passageId;  // ← THÊM
    private Integer audioId;
    private Integer orderInTest;
    private String audioResponse;      // Base64 encoded audio
    private Integer audioDuration;     // Duration in seconds
    private String audioFileType;      // webm, mp3, wav
    private Long audioFileSize;        // File size in bytes
    private String audioMimeType;      // MIME type for audio
    private String responseType;       // TEXT, AUDIO, MIXED
    private BigDecimal manualScore;
    private String feedback;
    private String graderName;
    private LocalDateTime feedbackGivenAt;
    private Boolean requiresManualGrading;

    // Constructors
    public StudentResponseDTO() {
    }

    public StudentResponseDTO(Integer questionId, String audioResponse, Integer audioDuration, String audioFileType) {
        this.questionId = questionId;
        this.audioResponse = audioResponse;
        this.audioDuration = audioDuration;
        this.audioFileType = audioFileType;
    }

    public boolean isTextResponse() {
        return responseText != null && !responseText.trim().isEmpty();
    }

    public boolean isAudioResponse() {
        return audioResponse != null && !audioResponse.trim().isEmpty();
    }

    public boolean hasValidResponse() {
        return isTextResponse() || isAudioResponse();
    }

    public boolean hasValidAudioData() {
        if (!isAudioResponse()) return false;

        // Check minimum length (base64 audio should be substantial)
        if (audioResponse.length() < 1000) return false;

        // Check if it looks like valid base64
        try {
            java.util.Base64.getDecoder().decode(audioResponse);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean hasAudioMetadata() {
        return audioDuration != null && audioDuration > 0 ||
                audioFileSize != null && audioFileSize > 0 ||
                audioFileType != null && !audioFileType.trim().isEmpty();
    }

    // ✅ UTILITY METHODS
    public String getResponseTypeString() {
        if (isAudioResponse()) return "AUDIO";
        if (isTextResponse()) return "TEXT";
        return "NONE";
    }

    public String getAudioDurationFormatted() {
        if (audioDuration == null || audioDuration <= 0) {
            return "0:00";
        }

        int minutes = audioDuration / 60;
        int seconds = audioDuration % 60;
        return String.format("%d:%02d", minutes, seconds);
    }

    public String getAudioSizeFormatted() {
        if (audioFileSize == null || audioFileSize <= 0) {
            return "0 B";
        }

        if (audioFileSize < 1024) {
            return audioFileSize + " B";
        } else if (audioFileSize < 1024 * 1024) {
            return String.format("%.1f KB", audioFileSize / 1024.0);
        } else {
            return String.format("%.1f MB", audioFileSize / (1024.0 * 1024.0));
        }
    }

    // ✅ VALIDATION FOR SPEAKING QUESTIONS
    public boolean isValidSpeakingResponse() {
        return isAudioResponse() &&
                hasValidAudioData() &&
                audioDuration != null &&
                audioDuration >= 10; // At least 10 seconds for speaking
    }

    // ✅ VALIDATION FOR WRITING QUESTIONS
    public boolean isValidWritingResponse() {
        return isTextResponse() &&
                responseText.trim().length() >= 50; // At least 50 characters for writing
    }

    // ✅ GET WORD COUNT for writing responses
    public int getWordCount() {
        if (!isTextResponse()) return 0;
        return responseText.trim().split("\\s+").length;
    }

    // ✅ AUDIO DATA CLEANUP
    public String getCleanAudioBase64() {
        if (!isAudioResponse()) return null;

        String cleanData = audioResponse;

        // Remove data URL prefix if present
        if (cleanData.startsWith("data:")) {
            int commaIndex = cleanData.indexOf(",");
            if (commaIndex != -1) {
                cleanData = cleanData.substring(commaIndex + 1);
            }
        }

        return cleanData;
    }

    // ✅ ESTIMATED FILE SIZE from base64
    public long getEstimatedAudioFileSize() {
        if (!isAudioResponse()) return 0;

        // Base64 has ~33% overhead, so actual data is ~75% of base64 length
        return (long) (getCleanAudioBase64().length() * 0.75);
    }

    // ✅ VALIDATION SUMMARY
    public ResponseValidation validateResponse() {
        ResponseValidation validation = new ResponseValidation();

        validation.hasResponse = hasValidResponse();
        validation.hasText = isTextResponse();
        validation.hasAudio = isAudioResponse();

        if (isAudioResponse()) {
            validation.audioDataValid = hasValidAudioData();
            validation.audioHasMetadata = hasAudioMetadata();
            validation.audioMinDuration = audioDuration != null && audioDuration >= 5;
        }

        if (isTextResponse()) {
            validation.textMinLength = responseText.trim().length() >= 10;
            validation.wordCount = getWordCount();
        }

        validation.isValid = validation.hasResponse &&
                (validation.audioDataValid || validation.textMinLength);

        return validation;
    }

    // ✅ VALIDATION RESULT CLASS
    public static class ResponseValidation {
        public boolean isValid = false;
        public boolean hasResponse = false;
        public boolean hasText = false;
        public boolean hasAudio = false;
        public boolean isMixed = false;
        public boolean audioDataValid = false;
        public boolean audioHasMetadata = false;
        public boolean audioMinDuration = false;
        public boolean textMinLength = false;
        public int wordCount = 0;

        @Override
        public String toString() {
            return String.format("ResponseValidation{valid=%s, hasResponse=%s, text=%s, audio=%s, mixed=%s}",
                    isValid, hasResponse, hasText, hasAudio, isMixed);
        }
    }

    public boolean hasGrade() {
        return manualScore != null || isCorrect != null;
    }

    public String getResponseType() {
        if (isAudioResponse()) return "AUDIO";
        if (isTextResponse()) return "TEXT";
        return "NONE";
    }
}