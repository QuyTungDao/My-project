package tungdao.com.project1.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho tạo audio Listening
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListeningAudioCreateDTO {
    private String title;
    private String filePath;
    private String fileType = "MP3";
    private String transcript;
    private String section; // SECTION1, SECTION2, ...
    private Integer orderInTest = 1;
}