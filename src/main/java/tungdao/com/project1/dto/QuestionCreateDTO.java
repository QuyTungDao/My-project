package tungdao.com.project1.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho tạo câu hỏi
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class QuestionCreateDTO {

    private String questionText;

    private String questionType; // MCQ, FILL_IN_THE_BLANK, ...

    private String options; // JSON format

    private String section;

    private Integer orderInTest = 0;

    private Integer passageId; // Liên kết với đoạn văn (nếu có)

    private Integer audioId; // Liên kết với audio (nếu có)

    private String correctAnswer; // Đáp án đúng

    private String explanation; // Giải thích cho đáp án

    private String alternativeAnswers; // Các đáp án thay thế

    @Override
    public String toString() {
        return "QuestionCreateDTO{" +
                "questionText='" + (questionText != null && questionText.length() > 20 ? questionText.substring(0, 20) + "..." : questionText) + '\'' +
                ", questionType='" + questionType + '\'' +
                ", orderInTest=" + orderInTest +
                ", passageId=" + passageId +
                ", audioId=" + audioId +
                '}';
    }
}