package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
import tungdao.com.project1.dto.StudentResponseDTO;
import tungdao.com.project1.entity.StudentResponse;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service to handle audio processing for speaking tests
 */
@Service
public class AudioProcessingService {

    /**
     * Process and validate audio response from frontend
     */
    public AudioProcessingResult processAudioResponse(StudentResponseDTO responseDTO) {
        System.out.println("=== PROCESSING AUDIO RESPONSE ===");
        System.out.println("Question ID: " + responseDTO.getQuestionId());

        AudioProcessingResult result = new AudioProcessingResult();

        try {
            // ✅ VALIDATE INPUT
            if (responseDTO.getAudioResponse() == null || responseDTO.getAudioResponse().trim().isEmpty()) {
                result.success = false;
                result.error = "Audio response is empty";
                return result;
            }

            String audioData = responseDTO.getAudioResponse();
            System.out.println("Raw audio data length: " + audioData.length());

            // ✅ CLEAN BASE64 DATA
            String cleanBase64 = cleanAudioBase64(audioData);
            System.out.println("Clean base64 length: " + cleanBase64.length());

            // ✅ VALIDATE BASE64 FORMAT
            if (!isValidBase64(cleanBase64)) {
                result.success = false;
                result.error = "Invalid base64 audio format";
                return result;
            }

            // ✅ DECODE TO GET ACTUAL SIZE
            byte[] audioBytes = Base64.getDecoder().decode(cleanBase64);
            long actualFileSize = audioBytes.length;
            System.out.println("Decoded audio size: " + actualFileSize + " bytes");

            // ✅ VALIDATE FILE SIZE
            if (actualFileSize < 1000) { // Less than 1KB
                result.success = false;
                result.error = "Audio file too small (minimum 1KB required)";
                return result;
            }

            if (actualFileSize > 50 * 1024 * 1024) { // More than 50MB
                result.success = false;
                result.error = "Audio file too large (maximum 50MB allowed)";
                return result;
            }

            // ✅ VALIDATE DURATION
            Integer duration = responseDTO.getAudioDuration();
            if (duration == null || duration < 1) {
                System.out.println("⚠️ No duration provided, estimating...");
                duration = estimateAudioDuration(actualFileSize, responseDTO.getAudioFileType());
            }

            if (duration < 2) { // Less than 2 seconds
                result.success = false;
                result.error = "Audio too short (minimum 2 seconds required)";
                return result;
            }

            if (duration > 600) { // More than 10 minutes
                result.success = false;
                result.error = "Audio too long (maximum 10 minutes allowed)";
                return result;
            }

            // ✅ SET PROCESSED DATA
            result.success = true;
            result.cleanBase64 = cleanBase64;
            result.actualFileSize = actualFileSize;
            result.duration = duration;
            result.fileType = responseDTO.getAudioFileType() != null ?
                    responseDTO.getAudioFileType() : "webm";
            result.mimeType = determineMimeType(result.fileType);

            System.out.println("✅ Audio processing successful:");
            System.out.println("  - File size: " + formatFileSize(actualFileSize));
            System.out.println("  - Duration: " + formatDuration(duration));
            System.out.println("  - File type: " + result.fileType);

        } catch (Exception e) {
            System.err.println("❌ Error processing audio: " + e.getMessage());
            result.success = false;
            result.error = "Audio processing failed: " + e.getMessage();
        }

        return result;
    }

    /**
     * Apply processed audio data to StudentResponse
     */
    public void applyAudioData(StudentResponse response, AudioProcessingResult processingResult) {
        if (!processingResult.success) {
            throw new RuntimeException("Cannot apply invalid audio data: " + processingResult.error);
        }

        response.setAudioBase64(processingResult.cleanBase64);
        response.setAudioFileSize(processingResult.actualFileSize);
        response.setAudioDurationSeconds(processingResult.duration);
        response.setAudioFileType(processingResult.fileType);
        response.setAudioMimeType(processingResult.mimeType);

        System.out.println("✅ Applied audio data to StudentResponse");
    }

    /**
     * Get audio statistics for multiple responses
     */
    public Map<String, Object> getAudioStatistics(List<StudentResponse> responses) {
        List<StudentResponse> audioResponses = responses.stream()
                .filter(r -> r.getAudioBase64() != null && !r.getAudioBase64().trim().isEmpty())
                .toList();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalResponses", responses.size());
        stats.put("audioResponses", audioResponses.size());
        stats.put("textResponses", responses.size() - audioResponses.size());

        if (!audioResponses.isEmpty()) {
            // Duration statistics
            int totalDuration = audioResponses.stream()
                    .filter(r -> r.getAudioDurationSeconds() != null)
                    .mapToInt(StudentResponse::getAudioDurationSeconds)
                    .sum();

            // Size statistics
            long totalSize = audioResponses.stream()
                    .filter(r -> r.getAudioFileSize() != null)
                    .mapToLong(StudentResponse::getAudioFileSize)
                    .sum();

            stats.put("totalDurationSeconds", totalDuration);
            stats.put("totalFileSizeBytes", totalSize);
            stats.put("averageDurationSeconds", totalDuration / audioResponses.size());
            stats.put("averageFileSizeBytes", totalSize / audioResponses.size());
            stats.put("totalDurationFormatted", formatDuration(totalDuration));
            stats.put("totalSizeFormatted", formatFileSize(totalSize));

            // File type distribution
            Map<String, Long> fileTypes = audioResponses.stream()
                    .filter(r -> r.getAudioFileType() != null)
                    .collect(java.util.stream.Collectors.groupingBy(
                            StudentResponse::getAudioFileType,
                            java.util.stream.Collectors.counting()
                    ));
            stats.put("fileTypeDistribution", fileTypes);
        }

        return stats;
    }

    /**
     * Clean base64 audio data
     */
    private String cleanAudioBase64(String audioData) {
        if (audioData == null) return null;

        String cleaned = audioData.trim();

        // Remove data URL prefix if present
        if (cleaned.startsWith("data:")) {
            int commaIndex = cleaned.indexOf(",");
            if (commaIndex != -1) {
                cleaned = cleaned.substring(commaIndex + 1);
            }
        }

        // Remove any whitespace
        cleaned = cleaned.replaceAll("\\s", "");

        return cleaned;
    }

    /**
     * Validate base64 format
     */
    private boolean isValidBase64(String base64String) {
        if (base64String == null || base64String.trim().isEmpty()) {
            return false;
        }

        try {
            Base64.getDecoder().decode(base64String);
            return true;
        } catch (Exception e) {
            System.err.println("Invalid base64: " + e.getMessage());
            return false;
        }
    }

    /**
     * Estimate audio duration from file size (rough approximation)
     */
    private int estimateAudioDuration(long fileSizeBytes, String fileType) {
        // Rough estimates based on common bitrates
        int estimatedBitrate;

        switch (fileType != null ? fileType.toLowerCase() : "webm") {
            case "mp3":
                estimatedBitrate = 128; // 128 kbps
                break;
            case "wav":
                estimatedBitrate = 1411; // CD quality
                break;
            case "webm":
            case "ogg":
            default:
                estimatedBitrate = 96; // 96 kbps for webm/opus
                break;
        }

        // Duration = (file_size_in_bits) / (bitrate_in_bps)
        long fileSizeInBits = fileSizeBytes * 8;
        long bitrateInBps = estimatedBitrate * 1000;

        int estimatedDuration = (int) (fileSizeInBits / bitrateInBps);

        System.out.println("Estimated duration: " + estimatedDuration + "s (based on " + estimatedBitrate + " kbps)");

        return Math.max(1, estimatedDuration); // At least 1 second
    }

    /**
     * Determine MIME type from file extension
     */
    private String determineMimeType(String fileType) {
        if (fileType == null) return "audio/webm";

        switch (fileType.toLowerCase()) {
            case "mp3":
                return "audio/mpeg";
            case "wav":
                return "audio/wav";
            case "ogg":
                return "audio/ogg";
            case "webm":
            default:
                return "audio/webm";
        }
    }

    /**
     * Format file size for display
     */
    private String formatFileSize(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return String.format("%.1f KB", bytes / 1024.0);
        } else {
            return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        }
    }

    /**
     * Format duration for display
     */
    private String formatDuration(int seconds) {
        int minutes = seconds / 60;
        int remainingSeconds = seconds % 60;
        return String.format("%d:%02d", minutes, remainingSeconds);
    }

    /**
     * Result class for audio processing
     */
    public static class AudioProcessingResult {
        public boolean success = false;
        public String error = null;
        public String cleanBase64 = null;
        public long actualFileSize = 0;
        public int duration = 0;
        public String fileType = "webm";
        public String mimeType = "audio/webm";

        public boolean isValid() {
            return success && cleanBase64 != null && actualFileSize > 0 && duration > 0;
        }

        @Override
        public String toString() {
            return String.format("AudioProcessingResult{success=%s, size=%d, duration=%d, type=%s, error=%s}",
                    success, actualFileSize, duration, fileType, error);
        }
    }
}