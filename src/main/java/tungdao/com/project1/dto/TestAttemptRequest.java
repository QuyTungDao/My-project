package tungdao.com.project1.dto;

import lombok.Data;

import java.util.List;

@Data
public class TestAttemptRequest {
    private Integer testId;
    private List<StudentResponseDTO> responses;
}
