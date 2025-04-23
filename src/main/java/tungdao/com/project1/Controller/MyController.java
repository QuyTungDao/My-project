package tungdao.com.project1.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tungdao.com.project1.entity.*;
import tungdao.com.project1.repository.*;
import tungdao.com.project1.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MyController {
    @GetMapping("/data")
    public String getData() {
        return "Xin chào từ Spring Boot!";
    }

    @PostMapping("/data")
    public String postData(@RequestBody String data) {
        return "Dữ liệu nhận được: " + data;
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private PerformanceReportRepository performanceReportRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private StudentFlashcardProgressRepository studentFlashcardProgressRepository;

    @Autowired
    private StudentResponseRepository studentResponseRepository;

    @Autowired
    private TestResultRepository testResultRepository;

    @Autowired
    private TestScoreMappingRepository testScoreMappingRepository;

    @Autowired
    private AnswerRepository answerRepository;

    // Users
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Autowired
    private UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.save(user));
    }

    // Tests
    @GetMapping("/tests")
    public List<Test> getAllTests() {
        return testRepository.findAll();
    }

    @PostMapping("/tests")
    public Test createTest(@RequestBody Test test) {
        return testRepository.save(test);
    }

    // Flashcards
    @GetMapping("/flashcards")
    public List<FlashCard> getAllFlashcards() {
        return flashcardRepository.findAll();
    }

    @PostMapping("/flashcards")
    public FlashCard createFlashcard(@RequestBody FlashCard flashcard) {
        return flashcardRepository.save(flashcard);
    }

    // Performance Reports
    @GetMapping("/performance-reports")
    public List<PerformanceReport> getAllPerformanceReports() {
        return performanceReportRepository.findAll();
    }

    @PostMapping("/performance-reports")
    public PerformanceReport createPerformanceReport(@RequestBody PerformanceReport report) {
        return performanceReportRepository.save(report);
    }

    // Questions
    @GetMapping("/questions")
    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    @PostMapping("/questions")
    public Question createQuestion(@RequestBody Question question) {
        return questionRepository.save(question);
    }

    // Student Flashcard Progress
    @GetMapping("/student-flashcard-progress")
    public List<StudentFlashcardProgress> getAllStudentFlashcardProgress() {
        return studentFlashcardProgressRepository.findAll();
    }

    @PostMapping("/student-flashcard-progress")
    public StudentFlashcardProgress createStudentFlashcardProgress(@RequestBody StudentFlashcardProgress progress) {
        return studentFlashcardProgressRepository.save(progress);
    }

    // Student Responses
    @GetMapping("/student-responses")
    public List<StudentResponses> getAllStudentResponses() {
        return studentResponseRepository.findAll();
    }

    @PostMapping("/student-responses")
    public StudentResponses createStudentResponse(@RequestBody StudentResponses response) {
        return studentResponseRepository.save(response);
    }

    // Test Results
    @GetMapping("/test-results")
    public List<TestResult> getAllTestResults() {
        return testResultRepository.findAll();
    }

    @PostMapping("/test-results")
    public TestResult createTestResult(@RequestBody TestResult result) {
        return testResultRepository.save(result);
    }

    // Test Score Mappings
    @GetMapping("/test-score-mappings")
    public List<TestScoreMapping> getAllTestScoreMappings() {
        return testScoreMappingRepository.findAll();
    }

    @PostMapping("/test-score-mappings")
    public TestScoreMapping createTestScoreMapping(@RequestBody TestScoreMapping mapping) {
        return testScoreMappingRepository.save(mapping);
    }

    // Answers
    @GetMapping("/answers")
    public List<Answer> getAllAnswers() {
        return answerRepository.findAll();
    }

    @PostMapping("/answers")
    public Answer createAnswer(@RequestBody Answer answer) {
        return answerRepository.save(answer);
    }

}