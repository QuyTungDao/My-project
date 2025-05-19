
package tungdao.com.project1.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho tạo đoạn văn Reading
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadingPassageCreateDTO {
    private String title;
    private String content;
    private Integer orderInTest = 1;
}