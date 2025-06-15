package tungdao.com.project1.dto;

import lombok.Data;
import tungdao.com.project1.entity.FlashCard;

@Data
public class CreateFlashcardRequest {
    private String word;
    private String meaning;
    private String exampleSentence;
    private String context;
    private String category;
    private String pronunciation;
    private FlashCard.WordType wordType;
    private String synonyms;
    private String setName;
    private Boolean isPublic = false;
    private FlashCard.DifficultyLevel difficultyLevel = FlashCard.DifficultyLevel.MEDIUM;
}
