package tungdao.com.project1.dto;

import lombok.Data;
import tungdao.com.project1.entity.StudentFlashcardProgress;

@Data
public class RateFlashcardRequest {
    private Integer flashcardId;
    private StudentFlashcardProgress.DifficultyRating rating;

    @Override
    public String toString() {
        return "RateFlashcardRequest{" +
                "flashcardId=" + flashcardId +
                ", rating=" + rating +
                '}';
    }
}
