package tungdao.com.project1.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tungdao.com.project1.entity.Question;

/**
 * DTO cho tạo câu hỏi
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class QuestionCreateDTO {

    private Integer questionId;

    private String questionText;

    private String questionType; // MCQ, FILL_IN_THE_BLANK, ...

    private String options; // JSON format

    private String section;

    private String questionSetInstructions;

    private Integer orderInTest = 0;

    private Integer passageId; // Liên kết với đoạn văn (nếu có)

    private Integer audioId; // Liên kết với audio (nếu có)

    private String correctAnswer; // Đáp án đúng

    private String explanation; // Giải thích cho đáp án

    private String alternativeAnswers; // Các đáp án thay thế

    private String context;

    private Integer speakingPart; // 1, 2, 3

    private String taskType; // WRITING_TASK1_ACADEMIC, SPEAKING_PART1, etc.

    private String visualMaterialPath; // For Writing Task

    @Override
    public String toString() {
        return "QuestionCreateDTO{" +
                "id=" + questionId +
                ", questionText='" + (questionText != null && questionText.length() > 20 ?
                questionText.substring(0, 20) + "..." : questionText) + '\'' +
                ", questionType='" + questionType + '\'' +
                ", orderInTest=" + orderInTest +
                ", passageId=" + passageId +
                ", audioId=" + audioId +
                ", questionSetInstructions='" + questionSetInstructions + '\'' +
                ", hasContext=" + (context != null && !context.trim().isEmpty()) +
                ", contextLength=" + (context != null ? context.length() : 0) +
                ", taskType='" + taskType + '\'' +
                ", speakingPart=" + speakingPart +
                ", visualMaterialPath='" + visualMaterialPath + '\'' +
                '}';
    }
}