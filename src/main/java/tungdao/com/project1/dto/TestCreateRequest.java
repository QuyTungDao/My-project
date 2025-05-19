package tungdao.com.project1.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO cho yêu cầu tạo bài thi mới
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TestCreateRequest {

    private String testName;

    private String testType;

    private String description;

    private String instructions;

    private Integer durationMinutes;

    private BigDecimal passingScore = new BigDecimal("5.0");

    private Boolean isPractice = false;

    private Boolean isPublished = false;

    private List<ReadingPassageCreateDTO> readingPassages;

    private List<ListeningAudioCreateDTO> listeningAudio;

    private List<QuestionCreateDTO> questions;

    // Ghi đè toString để tránh vấn đề in ra các đối tượng phức tạp
    @Override
    public String toString() {
        return "TestCreateRequest{" +
                "testName='" + testName + '\'' +
                ", testType='" + testType + '\'' +
                ", durationMinutes=" + durationMinutes +
                ", passingScore=" + passingScore +
                ", isPractice=" + isPractice +
                ", isPublished=" + isPublished +
                ", questions=" + (questions != null ? questions.size() : 0) + " items" +
                ", readingPassages=" + (readingPassages != null ? readingPassages.size() : 0) + " items" +
                ", listeningAudio=" + (listeningAudio != null ? listeningAudio.size() : 0) + " items" +
                '}';
    }
}