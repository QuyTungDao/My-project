package tungdao.com.project1.mapper;

import org.springframework.stereotype.Component;
import tungdao.com.project1.dto.StudentResponseDTO;
import tungdao.com.project1.dto.TestAttemptDTO;
import tungdao.com.project1.entity.StudentResponse;
import tungdao.com.project1.entity.TestAttempt;

import java.util.ArrayList;
import java.util.List;
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
        System.out.println("Listening Score: " + attempt.getListeningScore());
        System.out.println("Reading Score: " + attempt.getReadingScore());

        TestAttemptDTO dto = new TestAttemptDTO();
        dto.setId(attempt.getId());

        if (attempt.getStudent() != null) {
            dto.setStudentId(attempt.getStudent().getId());
            dto.setStudentName(attempt.getStudent().getFullName());
        }

        if (attempt.getTest() != null) {
            dto.setTestId(attempt.getTest().getId());
            dto.setTestName(attempt.getTest().getTestName());
        }

        dto.setStartTime(attempt.getStartTime());
        dto.setEndTime(attempt.getEndTime());
        dto.setIsCompleted(attempt.getIsCompleted());
        dto.setListeningScore(attempt.getListeningScore());
        dto.setReadingScore(attempt.getReadingScore());
        dto.setWritingScore(attempt.getWritingScore());
        dto.setSpeakingScore(attempt.getSpeakingScore());
        dto.setTotalScore(attempt.getTotalScore());

        // Xử lý an toàn với responses để tránh ConcurrentModificationException
        try {
            if (attempt.getResponses() != null) {
                System.out.println("Responses count: " + attempt.getResponses().size());

                // Tạo một bản sao an toàn của tập hợp responses trước khi xử lý
                List<StudentResponse> responsesList = new ArrayList<>(attempt.getResponses());
                List<StudentResponseDTO> responseDTOs = responsesList.stream()
                        .map(this::toResponseDTO)
                        .collect(Collectors.toList());
                dto.setResponses(responseDTOs);

                System.out.println("Mapped responses count: " + responseDTOs.size());
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi xử lý responses: " + e.getMessage());
            e.printStackTrace();
            // Đặt một danh sách trống trong trường hợp có lỗi
            dto.setResponses(new ArrayList<>());
        }

        System.out.println("=== MAPPING COMPLETED ===");
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
            // Thêm questionType nếu Question entity có field này
            dto.setQuestionType(response.getQuestion().getQuestionType() != null ?
                    response.getQuestion().getQuestionType().toString() : null);
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
        dto.setSubmittedAt(response.getSubmittedAt()); // ← BỔ SUNG FIELD NÀY

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

    // Optional: Reverse mapping nếu cần
    public StudentResponse toEntity(StudentResponseDTO dto) {
        if (dto == null) {
            return null;
        }

        StudentResponse entity = new StudentResponse();
        entity.setId(dto.getId());
        entity.setResponseText(dto.getResponseText());
        entity.setIsCorrect(dto.getIsCorrect());
        entity.setSubmittedAt(dto.getSubmittedAt());

        return entity;
    }
}