package tungdao.com.project1.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradingRequest {
    private Integer attemptId;           // Thay vì responseId
    private BigDecimal overallScore;     // Thay vì manualScore
    private CriteriaScores criteriaScores; // ✅ Thêm mới
    private String feedback;             // ✅ Giữ nguyên
    private String testType;             // ✅ Thêm mới

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CriteriaScores {
        // For SPEAKING
        private BigDecimal fluency;
        private BigDecimal lexical;
        private BigDecimal grammar;
        private BigDecimal pronunciation;

        // For WRITING
        private BigDecimal task_achievement;
        private BigDecimal coherence;
    }
}
