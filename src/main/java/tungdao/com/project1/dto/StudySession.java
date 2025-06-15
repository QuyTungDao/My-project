package tungdao.com.project1.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class StudySession {
    private Integer studentId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer cardsStudied;
    private Integer correctCount;

    public Double getAccuracy() {
        if (cardsStudied == 0) return 0.0;
        return (correctCount * 100.0) / cardsStudied;
    }

    public Long getDurationMinutes() {
        if (endTime == null) return 0L;
        return java.time.Duration.between(startTime, endTime).toMinutes();
    }
}

