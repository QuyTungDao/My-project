package tungdao.com.project1.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tungdao.com.project1.entity.Question;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class QuestionDTO {
    private Integer id;  // ← Field này cần có cho response
    private String questionText;
    private String questionType;
    private String options;
    private String section;
    private String questionSetInstructions;  // ← QUAN TRỌNG
    private Integer orderInTest;
    private Integer passageId;
    private Integer audioId;
    private String context;

    // Constructor từ Entity - ĐÚNG CLASS lần này
    public QuestionDTO(Question question) {
        this.id = question.getId();
        this.questionText = question.getQuestionText();
        this.questionType = question.getQuestionType() != null ?
                question.getQuestionType().toString() : null;
        this.options = question.getOptions();
        this.section = question.getSection();
        this.context = question.getContext();

        // ✅ MAPPING QUAN TRỌNG:
        this.questionSetInstructions = question.getQuestionSetInstructions();

        this.orderInTest = question.getOrderInTest();

        // Mapping relationships
        this.passageId = question.getPassage() != null ?
                question.getPassage().getId() : null;
        this.audioId = question.getAudio() != null ?
                question.getAudio().getId() : null;

        // Debug log
        System.out.println("QuestionDTO created: ID=" + this.id +
                ", Instructions='" + this.questionSetInstructions + "'" +
                ", PassageId=" + this.passageId);
    }
}
