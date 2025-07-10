package tungdao.com.project1.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TestAttemptRequest {
    private Integer testId;
    private LocalDateTime startTime; // Add this field
    private List<ResponseData> responses;  // Change from StudentResponseDTO to ResponseData

    @Data
    public static class ResponseData {
        private Integer questionId;
        private String responseText;     // For text answers
        private String audioResponse;    // For audio (base64)
        private Integer audioDuration;   // Duration in seconds
        private String audioFileType;    // File type (webm, mp3, etc.)
        private Long audioFileSize;      // File size in bytes
        private String audioMimeType;    // MIME type

        // Constructor for text responses
        public ResponseData(Integer questionId, String responseText) {
            this.questionId = questionId;
            this.responseText = responseText;
        }

        // Constructor for audio responses
        public ResponseData(Integer questionId, String audioResponse, Integer audioDuration,
                            String audioFileType, Long audioFileSize, String audioMimeType) {
            this.questionId = questionId;
            this.audioResponse = audioResponse;
            this.audioDuration = audioDuration;
            this.audioFileType = audioFileType;
            this.audioFileSize = audioFileSize;
            this.audioMimeType = audioMimeType;
        }

        public ResponseData() {} // Default constructor

        // Helper methods
        public boolean hasTextResponse() {
            return responseText != null && !responseText.trim().isEmpty();
        }

        public boolean hasAudioResponse() {
            return audioResponse != null && !audioResponse.trim().isEmpty();
        }

        public String getResponseType() {
            if (hasAudioResponse()) return "AUDIO";
            if (hasTextResponse()) return "TEXT";
            return "NONE";
        }
    }
}