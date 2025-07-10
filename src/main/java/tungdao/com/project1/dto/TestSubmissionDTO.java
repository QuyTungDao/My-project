package tungdao.com.project1.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestSubmissionDTO {
    private Integer id;
    private Integer testId;
    private String testName;
    private String testType;

    private Integer studentId;
    private String studentName;
    private String studentEmail;

    private BigDecimal totalScore;
    private BigDecimal listeningScore;
    private BigDecimal readingScore;
    private BigDecimal writingScore;
    private BigDecimal speakingScore;

    private LocalDateTime submittedAt;
    private Boolean isCompleted;
    private String status; // "completed", "pending_grading"
    private Boolean requiresManualGrading;
}