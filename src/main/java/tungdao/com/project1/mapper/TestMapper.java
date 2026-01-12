package tungdao.com.project1.mapper;

import org.springframework.stereotype.Component;
import tungdao.com.project1.dto.TestDTO;
import tungdao.com.project1.entity.Test;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class TestMapper {

    /**
     * Chuyển đổi entity Test thành DTO
     */
    public TestDTO toDTO(Test test) {
        if (test == null) {
            return null;
        }

        TestDTO dto = new TestDTO();
        dto.setId(test.getId());
        dto.setCreatorId(test.getCreator() != null ? test.getCreator().getId() : null);
        dto.setCreatorName(test.getCreator() != null ? test.getCreator().getFullName() : null);
        dto.setCreatorEmail(test.getCreator() != null ? test.getCreator().getEmail() : null); // ← THÊM
        dto.setTestName(test.getTestName());
        dto.setTestType(test.getTestType());
        dto.setDescription(test.getDescription());
        dto.setInstructions(test.getInstructions());
        dto.setDurationMinutes(test.getDurationMinutes());
        dto.setPassingScore(test.getPassingScore());
        dto.setIsPractice(test.getIsPractice());
        dto.setIsPublished(test.getIsPublished());
        dto.setCreatedAt(test.getCreatedAt());
        dto.setUpdatedAt(test.getUpdatedAt());
        dto.setQuestionCount(test.getQuestions() != null ? test.getQuestions().size() : 0);

        return dto;
    }

    /**
     * Chuyển đổi danh sách Test thành danh sách TestDTO
     */
    public List<TestDTO> toDTOList(List<Test> tests) {
        if (tests == null) {
            return null;
        }

        return tests.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Chuyển đổi DTO thành entity Test (nếu cần)
     */
    public Test toEntity(TestDTO dto) {
        if (dto == null) {
            return null;
        }

        Test test = new Test();
        test.setId(dto.getId());
        test.setTestName(dto.getTestName());
        test.setTestType(dto.getTestType());
        test.setDescription(dto.getDescription());
        test.setInstructions(dto.getInstructions());
        test.setDurationMinutes(dto.getDurationMinutes());
        test.setPassingScore(dto.getPassingScore());
        test.setIsPractice(dto.getIsPractice());
        test.setIsPublished(dto.getIsPublished());

        // Không thiết lập creator vì cần entity User

        return test;
    }
}