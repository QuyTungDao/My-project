package tungdao.com.project1.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FlashcardStatistics {
    private Integer currentStreak;
    private Integer longestStreak;
    private Integer totalLearned;
    private Double accuracy;
    private List<Object[]> masteryBreakdown;

    // Additional fields có thể thêm
    private Integer newCards;
    private Integer learningCards;
    private Integer reviewCards;
    private Integer masteredCards;

    public Integer getNewCards() {
        return getCountByMasteryLevel("NEW");
    }

    public Integer getLearningCards() {
        return getCountByMasteryLevel("LEARNING");
    }

    public Integer getReviewCards() {
        return getCountByMasteryLevel("REVIEW");
    }

    public Integer getMasteredCards() {
        return getCountByMasteryLevel("MASTERED");
    }

    private Integer getCountByMasteryLevel(String level) {
        if (masteryBreakdown == null) return 0;

        return masteryBreakdown.stream()
                .filter(arr -> arr.length >= 2 && level.equals(arr[0].toString()))
                .findFirst()
                .map(arr -> ((Number) arr[1]).intValue())
                .orElse(0);
    }
}