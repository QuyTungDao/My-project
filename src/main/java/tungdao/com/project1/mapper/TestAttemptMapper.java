package tungdao.com.project1.mapper;

import org.springframework.stereotype.Component;
import tungdao.com.project1.dto.StudentResponseDTO;
import tungdao.com.project1.dto.TestAttemptDTO;
import tungdao.com.project1.entity.StudentResponse;
import tungdao.com.project1.entity.TestAttempt;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class TestAttemptMapper {

    public TestAttemptDTO toDTO(TestAttempt attempt) {
        if (attempt == null) {
            return null;
        }

        System.out.println("=== MAPPING TestAttempt to DTO ===");
        System.out.println("Attempt ID: " + attempt.getId());
        System.out.println("Total Score: " + attempt.getTotalScore());
        System.out.println("Overall Score: " + attempt.getOverallScore());

        TestAttemptDTO dto = new TestAttemptDTO();
        dto.setId(attempt.getId());

        // Basic student info
        if (attempt.getStudent() != null) {
            dto.setStudentId(attempt.getStudent().getId());
            dto.setStudentName(attempt.getStudent().getFullName());
        }

        // Basic test info
        if (attempt.getTest() != null) {
            dto.setTestId(attempt.getTest().getId());
            dto.setTestName(attempt.getTest().getTestName());
            if (attempt.getTest().getTestType() != null) {
                dto.setTestType(attempt.getTest().getTestType().name());
            }
        }

        // Time and completion info
        dto.setStartTime(attempt.getStartTime());
        dto.setEndTime(attempt.getEndTime());
        dto.setIsCompleted(attempt.getIsCompleted());

        // Score fields
        dto.setListeningScore(attempt.getListeningScore());
        dto.setReadingScore(attempt.getReadingScore());
        dto.setWritingScore(attempt.getWritingScore());
        dto.setSpeakingScore(attempt.getSpeakingScore());
        dto.setTotalScore(attempt.getTotalScore());

        // ✅ GRADING FIELDS MAPPING
        if (attempt.getGrader() != null) {
            dto.setGraderId(attempt.getGrader().getId());
            dto.setGraderName(attempt.getGrader().getFullName());
            System.out.println("Mapped grader: " + attempt.getGrader().getFullName());
        } else {
            System.out.println("No grader found");
        }

        dto.setGradedAt(attempt.getGradedAt());
        dto.setOverallFeedback(attempt.getOverallFeedback());
        dto.setOverallScore(attempt.getOverallScore());

        // Grading status
        if (attempt.getGradingStatus() != null) {
            dto.setGradingStatus(attempt.getGradingStatus().getCode());
            System.out.println("Mapped grading status: " + attempt.getGradingStatus().getCode());
        } else {
            dto.setGradingStatus("PENDING");
            System.out.println("Default grading status: PENDING");
        }

        // Final score computation
        if (attempt.getOverallScore() != null) {
            dto.setFinalScore(attempt.getOverallScore());
            System.out.println("Final score from overall: " + attempt.getOverallScore());
        } else {
            dto.setFinalScore(attempt.getTotalScore());
            System.out.println("Final score from total: " + attempt.getTotalScore());
        }

        // Responses mapping with safety
        try {
            Set<StudentResponse> responses = attempt.getResponses();
            if (responses != null) {
                System.out.println("Processing responses collection...");

                List<StudentResponseDTO> responseDTOs = responses.stream()
                        .filter(Objects::nonNull)
                        .map(this::toResponseDTO)
                        .collect(Collectors.toList());
                dto.setResponses(responseDTOs);

                System.out.println("Mapped responses count: " + responseDTOs.size());
            } else {
                dto.setResponses(new ArrayList<>());
            }
        } catch (Exception e) {
            System.err.println("Error processing responses: " + e.getMessage());
            e.printStackTrace();
            dto.setResponses(new ArrayList<>());
        }

        System.out.println("=== MAPPING COMPLETED ===");
        System.out.println("DTO Final Grading Status: " + dto.getGradingStatus());
        System.out.println("DTO Final Score: " + dto.getFinalScore());
        System.out.println("DTO Overall Score: " + dto.getOverallScore());

        return dto;
    }

    public StudentResponseDTO toResponseDTO(StudentResponse response) {
        if (response == null) {
            return null;
        }

        StudentResponseDTO dto = new StudentResponseDTO();
        dto.setId(response.getId());

        if (response.getQuestion() != null) {
            dto.setQuestionId(response.getQuestion().getId());
            dto.setQuestionText(response.getQuestion().getQuestionText());

            dto.setQuestionType(
                    response.getQuestion().getQuestionType() != null ?
                            response.getQuestion().getQuestionType().toString() : null
            );

            dto.setOrderInTest(response.getQuestion().getOrderInTest());

            if (response.getQuestion().getPassage() != null) {
                dto.setPassageId(response.getQuestion().getPassage().getId());
            }

            if (response.getQuestion().getAudio() != null) {
                dto.setAudioId(response.getQuestion().getAudio().getId());
            }
        }

        dto.setResponseText(response.getResponseText());
        dto.setIsCorrect(response.getIsCorrect());
        dto.setSubmittedAt(response.getSubmittedAt());

        // ✅ Add grading fields for responses
        dto.setManualScore(response.getManualScore());
        dto.setFeedback(response.getFeedback());

        return dto;
    }

    public List<TestAttemptDTO> toDTOList(List<TestAttempt> attempts) {
        if (attempts == null) {
            return new ArrayList<>();
        }
        return attempts.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // Optional: Reverse mapping if needed
    public StudentResponse toEntity(StudentResponseDTO dto) {
        if (dto == null) {
            return null;
        }

        StudentResponse entity = new StudentResponse();
        entity.setId(dto.getId());
        entity.setResponseText(dto.getResponseText());
        entity.setIsCorrect(dto.getIsCorrect());
        entity.setSubmittedAt(dto.getSubmittedAt());
        entity.setManualScore(dto.getManualScore());
        entity.setFeedback(dto.getFeedback());

        return entity;
    }
}