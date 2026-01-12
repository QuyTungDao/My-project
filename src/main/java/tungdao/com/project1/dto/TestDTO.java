package tungdao.com.project1.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tungdao.com.project1.entity.TestType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for Test entity
 * Sử dụng để chuyển đổi dữ liệu từ entity sang JSON mà không gặp vấn đề circular reference
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestDTO {
    private Integer id;
    private Integer creatorId;
    private String creatorName;
    private String creatorEmail;
    private String testName;
    private TestType testType;
    private String description;
    private String instructions;
    private Integer durationMinutes;
    private BigDecimal passingScore;
    private Boolean isPractice;
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String creatorRole;
    private Integer questionCount;

    // Không bao gồm danh sách questions, readingPassages, listeningAudios, attempts
    // để tránh vòng lặp vô tận
}