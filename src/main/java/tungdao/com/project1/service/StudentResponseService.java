package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
import tungdao.com.project1.entity.ResponseType;
import tungdao.com.project1.entity.StudentResponse;
import tungdao.com.project1.repository.StudentResponseRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudentResponseService {
    private final StudentResponseRepository studentResponseRepository;

    public StudentResponseService(StudentResponseRepository studentResponseRepository) {
        this.studentResponseRepository = studentResponseRepository;
    }

    public List<StudentResponse> getResponsesByAttemptId(Integer attemptId) {
        return studentResponseRepository.findByAttemptId(attemptId);
    }

    public StudentResponse saveStudentResponse(StudentResponse response) {
        try {
            // ✅ VALIDATE BEFORE SAVING
            validateStudentResponse(response);

            // ✅ SET RESPONSE TYPE automatically
            if (response.getResponseType() == null) {
                response.setResponseType(determineResponseType(response));
            }

            // ✅ LOG BEFORE SAVE
            logResponseInfo(response);

            // ✅ SAVE TO DATABASE
            StudentResponse saved = studentResponseRepository.save(response);

            // ✅ VERIFY SAVE SUCCESS
            if (saved.getId() == null) {
                throw new RuntimeException("Failed to save response - no ID generated");
            }

            System.out.println("✅ Successfully saved response ID: " + saved.getId());

            // ✅ VERIFY AUDIO DATA if present
            if (saved.getAudioBase64() != null) {
                System.out.println("✅ Audio data verified: " + saved.getAudioBase64().length() + " characters");
            }

            return saved;

        } catch (Exception e) {
            System.err.println("❌ Error saving StudentResponse: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to save student response", e);
        }
    }

    /**
     * Validate student response data
     */
    private void validateStudentResponse(StudentResponse response) {
        if (response == null) {
            throw new IllegalArgumentException("StudentResponse cannot be null");
        }

        if (response.getQuestion() == null) {
            throw new IllegalArgumentException("Question cannot be null");
        }

        if (response.getStudent() == null) {
            throw new IllegalArgumentException("Student cannot be null");
        }

        if (response.getAttempt() == null) {
            throw new IllegalArgumentException("TestAttempt cannot be null");
        }

        // ✅ VALIDATE that at least one response type exists
        boolean hasText = response.getResponseText() != null && !response.getResponseText().trim().isEmpty();
        boolean hasAudio = response.getAudioBase64() != null && !response.getAudioBase64().trim().isEmpty();

        if (!hasText && !hasAudio) {
            throw new IllegalArgumentException("Response must have either text or audio content");
        }

        // ✅ VALIDATE AUDIO if present
        if (hasAudio) {
            validateAudioResponse(response);
        }
    }

    /**
     * Validate audio response data
     */
    private void validateAudioResponse(StudentResponse response) {
        String audioData = response.getAudioBase64();

        if (audioData.length() < 100) {
            throw new IllegalArgumentException("Audio data too small");
        }

        if (audioData.length() > 100_000_000) { // 100MB limit for base64
            throw new IllegalArgumentException("Audio data too large");
        }

        // ✅ VALIDATE BASE64 FORMAT
        try {
            java.util.Base64.getDecoder().decode(audioData);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid base64 audio data", e);
        }

        // ✅ VALIDATE AUDIO METADATA
        if (response.getAudioDurationSeconds() != null && response.getAudioDurationSeconds() < 0) {
            throw new IllegalArgumentException("Audio duration cannot be negative");
        }

        if (response.getAudioFileSize() != null && response.getAudioFileSize() < 0) {
            throw new IllegalArgumentException("Audio file size cannot be negative");
        }
    }

    /**
     * Determine response type automatically
     */
    private ResponseType determineResponseType(StudentResponse response) {
        boolean hasText = response.getResponseText() != null && !response.getResponseText().trim().isEmpty();
        boolean hasAudio = response.getAudioBase64() != null && !response.getAudioBase64().trim().isEmpty();

        if (hasAudio) {
            return ResponseType.AUDIO;
        } else if (hasText) {
            return ResponseType.TEXT;
        } else {
            return ResponseType.TEXT; // Default
        }
    }

    /**
     * Log response information for debugging
     */
    private void logResponseInfo(StudentResponse response) {
        System.out.println("=== SAVING STUDENT RESPONSE ===");
        System.out.println("Question ID: " + response.getQuestion().getId());
        System.out.println("Student ID: " + response.getStudent().getId());
        System.out.println("Attempt ID: " + response.getAttempt().getId());
        System.out.println("Response Type: " + response.getResponseType());

        if (response.getResponseText() != null) {
            System.out.println("Text Response: '" + response.getResponseText() + "'");
        }

        if (response.getAudioBase64() != null) {
            System.out.println("Audio Response: " + response.getAudioBase64().length() + " characters");
            System.out.println("Audio Duration: " + response.getAudioDurationSeconds() + " seconds");
            System.out.println("Audio File Type: " + response.getAudioFileType());
            System.out.println("Audio File Size: " + response.getAudioFileSize() + " bytes");
        }
    }

    /**
     * Get responses with audio data for a specific test attempt
     */
    public List<StudentResponse> getAudioResponsesByAttemptId(Integer attemptId) {
        return studentResponseRepository.findByAttemptId(attemptId)
                .stream()
                .filter(response -> response.getAudioBase64() != null &&
                        !response.getAudioBase64().trim().isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * Get audio response statistics
     */
    public Map<String, Object> getAudioResponseStats(Integer attemptId) {
        List<StudentResponse> audioResponses = getAudioResponsesByAttemptId(attemptId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAudioResponses", audioResponses.size());

        if (!audioResponses.isEmpty()) {
            // Calculate total duration
            int totalDuration = audioResponses.stream()
                    .filter(r -> r.getAudioDurationSeconds() != null)
                    .mapToInt(StudentResponse::getAudioDurationSeconds)
                    .sum();

            // Calculate total file size
            long totalSize = audioResponses.stream()
                    .filter(r -> r.getAudioFileSize() != null)
                    .mapToLong(StudentResponse::getAudioFileSize)
                    .sum();

            stats.put("totalDurationSeconds", totalDuration);
            stats.put("totalFileSizeBytes", totalSize);
            stats.put("averageDurationSeconds", totalDuration / audioResponses.size());
        }

        return stats;
    }
}
