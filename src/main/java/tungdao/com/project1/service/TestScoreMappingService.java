package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
import tungdao.com.project1.entity.TestScoreMapping;
import tungdao.com.project1.entity.TestScoreMappingType;
import tungdao.com.project1.repository.TestScoreMappingRepository;

import java.math.BigDecimal;

@Service
public class TestScoreMappingService {
    private final TestScoreMappingRepository testScoreMappingRepository;

    public TestScoreMappingService(TestScoreMappingRepository testScoreMappingRepository) {
        this.testScoreMappingRepository = testScoreMappingRepository;
    }

    public BigDecimal getIELTSScore(String testType, Integer correctAnswers) {
        try {
            // Chuyển đổi String thành enum TestScoreMappingType
            TestScoreMappingType type = TestScoreMappingType.valueOf(testType.toUpperCase());

            // Gọi repository với tham số kiểu enum
            TestScoreMapping mapping = testScoreMappingRepository
                    .findByTestTypeAndCorrectAnswersRange(type, correctAnswers);

            if (mapping != null) {
                return mapping.getIeltsScore();
            }
        } catch (IllegalArgumentException e) {
            System.err.println("Không thể chuyển đổi testType: " + testType + " thành enum TestScoreMappingType");
            e.printStackTrace();
        }

        // Mặc định nếu không tìm thấy
        return new BigDecimal("0.0");
    }
}