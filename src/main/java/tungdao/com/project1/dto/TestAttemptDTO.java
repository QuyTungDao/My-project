package tungdao.com.project1.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class TestAttemptDTO {
    private Integer id;
    private Integer studentId;
    private String studentName;
    private Integer testId;
    private String testName;
    private String testType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean isCompleted;
    private BigDecimal listeningScore;
    private BigDecimal readingScore;
    private BigDecimal writingScore;
    private BigDecimal speakingScore;
    private BigDecimal totalScore;
    private List<StudentResponseDTO> responses = new ArrayList<>();

    public String getCompletionTime() {
        if (startTime != null && endTime != null) {
            long minutes = java.time.Duration.between(startTime, endTime).toMinutes();
            long hours = minutes / 60;
            long remainingMinutes = minutes % 60;

            if (hours > 0) {
                return String.format("%d:%02d:00", hours, remainingMinutes);
            } else {
                return String.format("0:%02d:%02d", remainingMinutes, 0);
            }
        }
        return "0:00:00"; // Default fallback
    }

}