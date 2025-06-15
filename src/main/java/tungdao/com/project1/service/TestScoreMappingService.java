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

    // ✅ FIXED: Remove duplicate logic
    public BigDecimal getIELTSScore(String testType, Integer correctCount) {
        System.out.println("=== 🎯 IELTS SCORE MAPPING ===");
        System.out.println("Test Type: " + testType + ", Correct Count: " + correctCount);

        if (correctCount == null || correctCount <= 0) {
            System.out.println("❌ Zero/null correct count, returning 0.0");
            return BigDecimal.ZERO;
        }

        try {
            // ✅ Database lookup first
            TestScoreMappingType mappingType = TestScoreMappingType.valueOf(testType.toUpperCase());
            TestScoreMapping mapping = testScoreMappingRepository.findByTestTypeAndCorrectAnswersRange(
                    mappingType, correctCount);

            if (mapping != null) {
                BigDecimal score = mapping.getIeltsScore();
                System.out.println("✅ Database mapping found: " + correctCount + " correct → " + score + " IELTS");
                return score;
            } else {
                System.out.println("⚠️ No database mapping found, using fallback logic");
            }
        } catch (Exception e) {
            System.out.println("⚠️ Database mapping failed: " + e.getMessage());
        }

        // ✅ Fallback logic
        BigDecimal score;
        if ("READING".equalsIgnoreCase(testType)) {
            score = getReadingScore(correctCount);
            System.out.println("✅ Fallback READING mapping: " + correctCount + " correct → " + score + " IELTS");
        } else if ("LISTENING".equalsIgnoreCase(testType)) {
            score = getListeningScore(correctCount);
            System.out.println("✅ Fallback LISTENING mapping: " + correctCount + " correct → " + score + " IELTS");
        } else {
            System.out.println("❌ Unknown test type: " + testType);
            score = BigDecimal.ZERO;
        }

        // ✅ SANITY CHECK
        if (score.compareTo(BigDecimal.valueOf(9.0)) > 0) {
            System.err.println("🚨 ERROR: IELTS score > 9.0! Score: " + score);
            System.err.println("🚨 This suggests incorrect logic - returning correct count instead of IELTS score");
            return BigDecimal.ZERO;
        }

        return score;
    }

    // ✅ FIXED: READING mapping - Remove duplicate and dead code
    private BigDecimal getReadingScore(Integer correctCount) {
        System.out.println("🎯 Calculating READING IELTS score for " + correctCount + " correct answers");

        BigDecimal score;
        if (correctCount >= 39) score = BigDecimal.valueOf(9.0);
        else if (correctCount >= 37) score = BigDecimal.valueOf(8.5);
        else if (correctCount >= 35) score = BigDecimal.valueOf(8.0);
        else if (correctCount >= 33) score = BigDecimal.valueOf(7.5);
        else if (correctCount >= 30) score = BigDecimal.valueOf(7.0);
        else if (correctCount >= 27) score = BigDecimal.valueOf(6.5);
        else if (correctCount >= 23) score = BigDecimal.valueOf(6.0);
        else if (correctCount >= 19) score = BigDecimal.valueOf(5.5);
        else if (correctCount >= 15) score = BigDecimal.valueOf(5.0);
        else if (correctCount >= 13) score = BigDecimal.valueOf(4.5);
        else if (correctCount >= 10) score = BigDecimal.valueOf(4.0);
        else if (correctCount >= 8) score = BigDecimal.valueOf(3.5);  // 8-9 correct
        else if (correctCount >= 6) score = BigDecimal.valueOf(3.0);  // 6-7 correct ← 7 câu đúng = 3.0
        else if (correctCount >= 4) score = BigDecimal.valueOf(2.5);
        else if (correctCount >= 2) score = BigDecimal.valueOf(2.0);
        else if (correctCount >= 1) score = BigDecimal.valueOf(1.0);
        else score = BigDecimal.ZERO;

        System.out.println("📊 READING: " + correctCount + " correct → " + score + " IELTS band score");
        return score;
    }

    // ✅ LISTENING mapping (unchanged but cleaned up)
    private BigDecimal getListeningScore(Integer correctCount) {
        if (correctCount >= 39) return BigDecimal.valueOf(9.0);
        if (correctCount >= 37) return BigDecimal.valueOf(8.5);
        if (correctCount >= 35) return BigDecimal.valueOf(8.0);
        if (correctCount >= 32) return BigDecimal.valueOf(7.5);
        if (correctCount >= 30) return BigDecimal.valueOf(7.0);
        if (correctCount >= 26) return BigDecimal.valueOf(6.5);
        if (correctCount >= 23) return BigDecimal.valueOf(6.0);
        if (correctCount >= 18) return BigDecimal.valueOf(5.5);
        if (correctCount >= 16) return BigDecimal.valueOf(5.0);
        if (correctCount >= 13) return BigDecimal.valueOf(4.5);
        if (correctCount >= 10) return BigDecimal.valueOf(4.0);
        if (correctCount >= 8) return BigDecimal.valueOf(3.5);
        if (correctCount >= 6) return BigDecimal.valueOf(3.0);
        if (correctCount >= 4) return BigDecimal.valueOf(2.5);
        if (correctCount >= 2) return BigDecimal.valueOf(2.0);
        if (correctCount >= 1) return BigDecimal.valueOf(1.0);
        return BigDecimal.ZERO;
    }
}