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
    private TestAttemptRepository testAttemptRepository;

    @Autowired
    private TestScoreMappingRepository testScoreMappingRepository;

    @Autowired
    private CorrectAnswerRepository correctAnswerRepository;

    @Autowired
    private ReadingPassageRepository readingPassageRepository;

    @Autowired
    private ListeningAudioRepository listeningAudioRepository;

    @Autowired
    private SpeakingWritingCriteriaScoreRepository speakingWritingCriteriaScoreRepository;

    @Autowired
    private StudentProgressRepository studentProgressRepository;

    @Autowired
    private UserService userService;

    // Users
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping("/users")
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
    public List<FlashCard> getAllFlashCards() {
        return flashcardRepository.findAll();
    }

    @PostMapping("/flashcards")
    public FlashCard createFlashCard(@RequestBody FlashCard flashcard) {
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
    public List<StudentResponse> getAllStudentResponses() {
        return studentResponseRepository.findAll();
    }

    @PostMapping("/student-responses")
    public StudentResponse createStudentResponse(@RequestBody StudentResponse response) {
        return studentResponseRepository.save(response);
    }

    // Test Attempts
    @GetMapping("/test-attempts")
    public List<TestAttempt> getAllTestAttempts() {
        return testAttemptRepository.findAll();
    }

    @PostMapping("/test-attempts")
    public TestAttempt createTestAttempt(@RequestBody TestAttempt attempt) {
        return testAttemptRepository.save(attempt);
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

    // Correct Answers
    @GetMapping("/correct-answers")
    public List<CorrectAnswer> getAllCorrectAnswers() {
        return correctAnswerRepository.findAll();
    }

    @PostMapping("/correct-answers")
    public CorrectAnswer createCorrectAnswer(@RequestBody CorrectAnswer answer) {
        return correctAnswerRepository.save(answer);
    }

    // Reading Passages
    @GetMapping("/reading-passages")
    public List<ReadingPassage> getAllReadingPassages() {
        return readingPassageRepository.findAll();
    }

    @PostMapping("/reading-passages")
    public ReadingPassage createReadingPassage(@RequestBody ReadingPassage passage) {
        return readingPassageRepository.save(passage);
    }

    // Listening Audio
    @GetMapping("/listening-audio")
    public List<ListeningAudio> getAllListeningAudio() {
        return listeningAudioRepository.findAll();
    }

    @PostMapping("/listening-audio")
    public ListeningAudio createListeningAudio(@RequestBody ListeningAudio audio) {
        return listeningAudioRepository.save(audio);
    }

    // Speaking Writing Criteria Scores
    @GetMapping("/speaking-writing-criteria-scores")
    public List<SpeakingWritingCriteriaScore> getAllSpeakingWritingCriteriaScores() {
        return speakingWritingCriteriaScoreRepository.findAll();
    }

    @PostMapping("/speaking-writing-criteria-scores")
    public SpeakingWritingCriteriaScore createSpeakingWritingCriteriaScore(@RequestBody SpeakingWritingCriteriaScore score) {
        return speakingWritingCriteriaScoreRepository.save(score);
    }

    // Student Progress
    @GetMapping("/student-progress")
    public List<StudentProgress> getAllStudentProgress() {
        return studentProgressRepository.findAll();
    }

    @PostMapping("/student-progress")
    public StudentProgress createStudentProgress(@RequestBody StudentProgress progress) {
        return studentProgressRepository.save(progress);
    }
}