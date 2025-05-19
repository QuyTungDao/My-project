package tungdao.com.project1.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tungdao.com.project1.dto.TestAttemptDTO;
import tungdao.com.project1.entity.CorrectAnswer;
import tungdao.com.project1.entity.TestAttempt;
import tungdao.com.project1.mapper.TestAttemptMapper;
import tungdao.com.project1.service.CorrectAnswerService;
import tungdao.com.project1.service.TestAttemptService;

import java.util.List;

@RestController
@RequestMapping("/api/test-attempts")
public class TestAttemptController {

    private final TestAttemptService testAttemptService;
    private final CorrectAnswerService correctAnswerService;
    private final TestAttemptMapper testAttemptMapper;

    public TestAttemptController(TestAttemptService testAttemptService,
                                 CorrectAnswerService correctAnswerService,
                                 TestAttemptMapper testAttemptMapper) {
        this.testAttemptService = testAttemptService;
        this.correctAnswerService = correctAnswerService;
        this.testAttemptMapper = testAttemptMapper;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTestAttemptById(@PathVariable Integer id) {
        try {
            System.out.println("Đang lấy kết quả làm bài với ID: " + id);
            TestAttempt attempt = testAttemptService.getTestAttemptById(id);
            if (attempt == null) {
                System.out.println("Không tìm thấy kết quả làm bài với ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Không tìm thấy kết quả làm bài với ID: " + id);
            }

            System.out.println("Đã tìm thấy kết quả làm bài");

            // Chuyển đổi sang DTO để tránh vòng lặp vô tận
            TestAttemptDTO attemptDTO = testAttemptMapper.toDTO(attempt);

            // Thêm đáp án đúng cho từng câu trả lời
            if (attemptDTO.getResponses() != null) {
                attemptDTO.getResponses().forEach(responseDTO -> {
                    CorrectAnswer correctAnswer = correctAnswerService.getByQuestionId(responseDTO.getQuestionId());
                    if (correctAnswer != null) {
                        responseDTO.setCorrectAnswer(correctAnswer.getCorrectAnswerText());
                    }
                });
            }

            return ResponseEntity.ok(attemptDTO);
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy kết quả làm bài: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lấy kết quả làm bài: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getTestAttemptsByUserId(@PathVariable Integer userId) {
        try {
            System.out.println("Đang lấy danh sách kết quả làm bài của user ID: " + userId);
            return ResponseEntity.ok(testAttemptMapper.toDTOList(testAttemptService.getTestAttemptsByUserId(userId)));
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy danh sách kết quả làm bài: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lấy danh sách kết quả làm bài: " + e.getMessage());
        }
    }
}