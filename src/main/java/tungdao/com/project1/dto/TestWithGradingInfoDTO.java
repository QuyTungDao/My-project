package tungdao.com.project1.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TestWithGradingInfoDTO {
    private Integer id;
    private String testName;
    private String testType;
    private String description;
    private Integer durationMinutes;
    private BigDecimal passingScore;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private Integer totalSubmissions;
    private Integer pendingSubmissions;
}
