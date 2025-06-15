package tungdao.com.project1.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListeningAudioCreateDTO {
    private String title;

    // Traditional file path (optional, for backward compatibility)
    private String filePath;

    // Base64 data (new approach)
    private String audioBase64;
    private String originalFileName;
    private Long fileSize;
    private String mimeType;

    private String fileType = "MP3";
    private String transcript;
    private String section; // SECTION1, SECTION2, ...
    private Integer orderInTest = 1;
    private Integer durationSeconds;
}