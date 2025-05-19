package tungdao.com.project1.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import tungdao.com.project1.dto.*;
import tungdao.com.project1.entity.*;
import tungdao.com.project1.login_register.UserDetailsImpl;
import tungdao.com.project1.mapper.TestAttemptMapper;
import tungdao.com.project1.mapper.TestMapper;
import tungdao.com.project1.repository.UserRepository;
import tungdao.com.project1.service.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {
    private final TestService testService;
    private final ReadingPassageService readingPassageService;
    private final QuestionService questionService;
    private final TestAttemptService testAttemptService;
    private final StudentResponseService studentResponseService;
    private final CorrectAnswerService correctAnswerService;
    private final TestScoreMappingService testScoreMappingService;
    private final UserRepository userRepository;
    private final TestMapper testMapper;
    private final TestAttemptMapper testAttemptMapper;
    private final ListeningAudioService listeningAudioService;

    public TestController(TestService testService,
                          ReadingPassageService readingPassageService,
                          QuestionService questionService,
                          TestAttemptService testAttemptService,
                          StudentResponseService studentResponseService,
                          CorrectAnswerService correctAnswerService,
                          TestScoreMappingService testScoreMappingService,
                          UserRepository userRepository,
                          TestMapper testMapper,
                          TestAttemptMapper testAttemptMapper, ListeningAudioService listeningAudioService) {
        this.testService = testService;
        this.readingPassageService = readingPassageService;
        this.questionService = questionService;
        this.testAttemptService = testAttemptService;
        this.studentResponseService = studentResponseService;
        this.correctAnswerService = correctAnswerService;
        this.testScoreMappingService = testScoreMappingService;
        this.userRepository = userRepository;
        this.testMapper = testMapper;
        this.testAttemptMapper = testAttemptMapper;
        this.listeningAudioService = listeningAudioService;
    }

    // Lấy tất cả bài thi đã publish - Sử dụng DTO
    @GetMapping
    public ResponseEntity<List<TestDTO>> getAllPublishedTests() {
        try {
            System.out.println("Đang lấy danh sách đề thi đã published...");
            List<Test> tests = testService.getAllPublishedTests();

            // Log số lượng bài thi tìm được
            System.out.println("Found " + tests.size() + " published tests");

            // Chuyển đổi thành DTO
            List<TestDTO> testDTOs = testMapper.toDTOList(tests);

            for (TestDTO test : testDTOs) {
                System.out.println("Test: ID=" + test.getId() + ", Name=" + test.getTestName());
            }

            return ResponseEntity.ok(testDTOs);
        } catch (Exception e) {
            System.err.println("Error getting all published tests: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Lấy thông tin chi tiết của bài thi theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getTestById(@PathVariable Integer id) {
        try {
            System.out.println("Đang lấy thông tin đề thi với ID: " + id);
            Test test = testService.getTestById(id);
            if (test == null) {
                System.out.println("Không tìm thấy bài thi với ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Không tìm thấy bài thi với ID: " + id);
            }

            System.out.println("Đã tìm thấy bài thi: " + test.getTestName());

            // Tùy vào loại bài thi (reading/listening) để lấy thông tin phù hợp
            Map<String, Object> response = new HashMap<>();
            response.put("test", testMapper.toDTO(test));

            if (test.getTestType() != null && "READING".equals(test.getTestType().name())) {
                System.out.println("Đề thi là loại READING, lấy thêm thông tin passages...");
                List<ReadingPassage> passages = readingPassageService.getPassagesByTestId(id);
                System.out.println("Số lượng passages: " + passages.size());

                // Chỉ trả về thông tin cần thiết của passages để tránh vòng lặp vô tận
                List<Map<String, Object>> passageMaps = new ArrayList<>();
                for (ReadingPassage passage : passages) {
                    Map<String, Object> passageMap = new HashMap<>();
                    passageMap.put("id", passage.getId());
                    passageMap.put("title", passage.getTitle());
                    passageMap.put("content", passage.getContent());
                    passageMap.put("orderInTest", passage.getOrderInTest());
                    passageMaps.add(passageMap);
                }

                response.put("passages", passageMaps);
            }

            // Lấy danh sách câu hỏi của bài thi
            System.out.println("Lấy danh sách câu hỏi của bài thi...");
            List<Question> questions = questionService.getQuestionsByTestId(id);
            System.out.println("Số lượng câu hỏi: " + questions.size());

            // Chỉ trả về thông tin cần thiết của questions để tránh vòng lặp vô tận
            List<Map<String, Object>> questionMaps = new ArrayList<>();
            for (Question question : questions) {
                Map<String, Object> questionMap = new HashMap<>();
                questionMap.put("id", question.getId());
                questionMap.put("questionText", question.getQuestionText());
                questionMap.put("questionType", question.getQuestionType());
                questionMap.put("section", question.getSection());
                questionMap.put("orderInTest", question.getOrderInTest());
                questionMap.put("options", question.getOptions());

                // Thêm thông tin passage ID nếu có
                if (question.getPassage() != null) {
                    questionMap.put("passageId", question.getPassage().getId());
                }

                // Thêm thông tin audio ID nếu có
                if (question.getAudio() != null) {
                    questionMap.put("audioId", question.getAudio().getId());
                }

                questionMaps.add(questionMap);
            }

            response.put("questions", questionMaps);

            System.out.println("Trả về thông tin đề thi thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy thông tin đề thi: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lấy bài thi: " + e.getMessage());
        }
    }

    // Cập nhật phương thức saveTestAttempt để xử lý khi userDetails là null
    @PostMapping("/attempts")
    public ResponseEntity<?> saveTestAttempt(@RequestBody TestAttemptRequest request,
                                             @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("Đang lưu kết quả làm bài của người dùng...");

            // Xử lý khi userDetails là null
            Integer studentId;
            if (userDetails == null) {
                // Thử lấy Authentication từ context
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                System.out.println("Authentication từ context: " + (authentication != null ? authentication.getName() : "null"));

                if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
                    userDetails = (UserDetailsImpl) authentication.getPrincipal();
                    studentId = userDetails.getId();
                    System.out.println("Lấy được user ID từ SecurityContext: " + studentId);
                } else {
                    // Nếu không xác định được người dùng, trả về lỗi 401
                    System.err.println("Không xác định được người dùng đã đăng nhập");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body("Vui lòng đăng nhập để lưu kết quả bài thi");
                }
            } else {
                studentId = userDetails.getId();
                System.out.println("User ID từ tham số: " + studentId);
            }

            System.out.println("Test ID: " + request.getTestId());

            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> {
                        System.err.println("Không tìm thấy người dùng với ID: " + studentId);
                        return new RuntimeException("Không tìm thấy người dùng với ID: " + studentId);
                    });

            System.out.println("Tìm thấy user: " + student.getEmail());

            Test test = testService.getTestById(request.getTestId());
            if (test == null) {
                System.out.println("Không tìm thấy bài thi với ID: " + request.getTestId());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Không tìm thấy bài thi với ID: " + request.getTestId());
            }

            System.out.println("Tìm thấy đề thi: " + test.getTestName());

            // Tạo bản ghi test attempt
            TestAttempt attempt = new TestAttempt();
            attempt.setStudent(student);
            attempt.setTest(test);
            attempt.setStartTime(LocalDateTime.now());
            attempt.setIsCompleted(true);
            attempt = testAttemptService.saveTestAttempt(attempt);
            System.out.println("Đã lưu test attempt với ID: " + attempt.getId());

            // Lưu từng câu trả lời
            System.out.println("Đang xử lý " + request.getResponses().size() + " câu trả lời...");
            Map<String, Integer> scores = new HashMap<>(); // Để lưu số câu đúng cho từng kỹ năng

            List<StudentResponse> savedResponses = new ArrayList<>();
            for (StudentResponseDTO responseDTO : request.getResponses()) {
                Question question = questionService.getQuestionById(responseDTO.getQuestionId());
                if (question == null) {
                    System.out.println("Không tìm thấy câu hỏi với ID: " + responseDTO.getQuestionId());
                    continue;
                }

                StudentResponse response = new StudentResponse();
                response.setAttempt(attempt);
                response.setStudent(student);
                response.setQuestion(question);
                response.setResponseText(responseDTO.getResponseText());
                response.setSubmittedAt(LocalDateTime.now());

                // Kiểm tra câu trả lời
                CorrectAnswer correctAnswer = correctAnswerService.getByQuestionId(question.getId());
                if (correctAnswer != null) {
                    boolean isCorrect = checkAnswer(responseDTO.getResponseText(), correctAnswer);
                    response.setIsCorrect(isCorrect);

                    // Cập nhật điểm theo loại câu hỏi (listening/reading)
                    String testType = question.getTest().getTestType().name().toLowerCase();
                    scores.putIfAbsent(testType, 0);
                    if (isCorrect) {
                        scores.put(testType, scores.get(testType) + 1);
                    }
                }

                savedResponses.add(studentResponseService.saveStudentResponse(response));
            }

            // Tính điểm IELTS dựa trên số câu đúng
            System.out.println("Tính điểm IELTS dựa trên số câu đúng...");
            Map<String, BigDecimal> ieltsScores = calculateIELTSScores(scores);

            // Cập nhật điểm cho test attempt
            System.out.println("Cập nhật điểm cho test attempt...");
            updateTestAttemptScores(attempt, ieltsScores);

            Map<String, Object> result = new HashMap<>();
            result.put("attemptId", attempt.getId());
            result.put("scores", ieltsScores);
            result.put("totalQuestions", request.getResponses().size());
            result.put("correctAnswers", scores);

            System.out.println("Đã lưu kết quả làm bài thành công");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Lỗi khi lưu kết quả làm bài: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lưu kết quả: " + e.getMessage());
        }
    }

    // Tìm kiếm bài thi theo tên
    @GetMapping("/search")
    public ResponseEntity<List<TestDTO>> searchTests(@RequestParam String query) {
        try {
            System.out.println("Đang tìm kiếm bài thi với từ khóa: " + query);
            List<Test> tests = testService.searchTests(query);
            System.out.println("Tìm thấy " + tests.size() + " kết quả");

            // Chuyển đổi sang DTO
            List<TestDTO> testDTOs = testMapper.toDTOList(tests);

            return ResponseEntity.ok(testDTOs);
        } catch (Exception e) {
            System.err.println("Lỗi khi tìm kiếm bài thi: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Các phương thức hỗ trợ
    private boolean checkAnswer(String userResponse, CorrectAnswer correctAnswer) {
        // Kiểm tra câu trả lời của người dùng với đáp án đúng
        if (userResponse == null || userResponse.trim().isEmpty()) {
            return false;
        }

        // Chuyển đổi về chữ thường và loại bỏ khoảng trắng thừa
        String normalizedUserResponse = userResponse.trim().toLowerCase();
        String correctAnswerText = correctAnswer.getCorrectAnswerText().trim().toLowerCase();

        // Kiểm tra câu trả lời chính xác
        if (normalizedUserResponse.equals(correctAnswerText)) {
            return true;
        }

        // Kiểm tra câu trả lời thay thế (nếu có)
        if (correctAnswer.getAlternativeAnswers() != null) {
            String[] alternatives = correctAnswer.getAlternativeAnswers().split(",");
            for (String alt : alternatives) {
                if (normalizedUserResponse.equals(alt.trim().toLowerCase())) {
                    return true;
                }
            }
        }

        return false;
    }

    private Map<String, BigDecimal> calculateIELTSScores(Map<String, Integer> correctAnswerCounts) {
        Map<String, BigDecimal> ieltsScores = new HashMap<>();

        for (Map.Entry<String, Integer> entry : correctAnswerCounts.entrySet()) {
            String testType = entry.getKey();
            Integer correctCount = entry.getValue();

            // Lấy điểm IELTS tương ứng với số câu đúng từ bảng test_score_mapping
            BigDecimal ieltsScore = testScoreMappingService.getIELTSScore(testType, correctCount);
            ieltsScores.put(testType, ieltsScore);
        }

        // Tính điểm tổng (nếu có nhiều kỹ năng)
        if (!ieltsScores.isEmpty()) {
            double totalScore = ieltsScores.values().stream()
                    .mapToDouble(BigDecimal::doubleValue)
                    .average()
                    .orElse(0.0);
            ieltsScores.put("total", new BigDecimal(String.valueOf(totalScore)));
        }

        return ieltsScores;
    }

    private void updateTestAttemptScores(TestAttempt attempt, Map<String, BigDecimal> ieltsScores) {
        // Cập nhật điểm cho từng kỹ năng
        if (ieltsScores.containsKey("listening")) {
            attempt.setListeningScore(ieltsScores.get("listening"));
        }
        if (ieltsScores.containsKey("reading")) {
            attempt.setReadingScore(ieltsScores.get("reading"));
        }
        if (ieltsScores.containsKey("writing")) {
            attempt.setWritingScore(ieltsScores.get("writing"));
        }
        if (ieltsScores.containsKey("speaking")) {
            attempt.setSpeakingScore(ieltsScores.get("speaking"));
        }
        if (ieltsScores.containsKey("total")) {
            attempt.setTotalScore(ieltsScores.get("total"));
        }

        attempt.setEndTime(LocalDateTime.now());
        testAttemptService.saveTestAttempt(attempt);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createTest(@RequestBody TestCreateRequest request,
                                        @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("Đang xử lý yêu cầu tạo bài thi mới...");
            System.out.println("Request: " + request);

            // Debug số lượng câu hỏi
            if (request.getQuestions() != null) {
                System.out.println("Số lượng câu hỏi: " + request.getQuestions().size());
            }

            // Xử lý khi userDetails là null
            Integer creatorId;
            if (userDetails == null) {
                // Thử lấy Authentication từ context
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                System.out.println("Authentication từ context: " + (authentication != null ? authentication.getName() : "null"));

                if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
                    userDetails = (UserDetailsImpl) authentication.getPrincipal();
                    creatorId = userDetails.getId();
                    System.out.println("Lấy được user ID từ SecurityContext: " + creatorId);
                } else {
                    // Nếu không xác định được người dùng, trả về lỗi 401
                    System.err.println("Không xác định được người dùng đã đăng nhập");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body("Vui lòng đăng nhập để tạo bài thi");
                }
            } else {
                creatorId = userDetails.getId();
                System.out.println("User ID từ tham số: " + creatorId);
            }

            // Tìm thông tin người tạo
            User creator = userRepository.findById(creatorId)
                    .orElseThrow(() -> {
                        System.err.println("Không tìm thấy người dùng với ID: " + creatorId);
                        return new RuntimeException("Không tìm thấy người dùng với ID: " + creatorId);
                    });

            System.out.println("Tạo bài thi bởi user: " + creator.getEmail());

            // Tạo đối tượng Test từ request
            Test test = new Test();
            test.setCreator(creator);
            test.setTestName(request.getTestName());
            test.setTestType(TestType.valueOf(request.getTestType()));
            test.setDescription(request.getDescription());
            test.setInstructions(request.getInstructions());
            test.setDurationMinutes(request.getDurationMinutes());
            test.setPassingScore(request.getPassingScore());
            test.setIsPractice(request.getIsPractice());
            test.setIsPublished(request.getIsPublished());

            // Lưu bài thi
            test = testService.saveTest(test);
            System.out.println("Đã lưu bài thi với ID: " + test.getId());

            // Map để lưu trữ ID mới của các đoạn văn đã tạo
            Map<Integer, ReadingPassage> createdPassages = new HashMap<>();

            // Xử lý Reading Passages nếu là bài thi Reading
            if (request.getReadingPassages() != null && !request.getReadingPassages().isEmpty()) {
                System.out.println("Xử lý " + request.getReadingPassages().size() + " đoạn văn...");
                int passageIndex = 1;
                for (ReadingPassageCreateDTO passageDTO : request.getReadingPassages()) {
                    ReadingPassage passage = new ReadingPassage();
                    passage.setTest(test);
                    passage.setTitle(passageDTO.getTitle());
                    passage.setContent(passageDTO.getContent());
                    passage.setOrderInTest(passageDTO.getOrderInTest());

                    // Lưu passage và lấy ID mới
                    passage = readingPassageService.savePassage(passage);
                    System.out.println("Đã lưu passage: " + passage.getId() + " - " + passage.getTitle());

                    // Lưu vào map để sử dụng khi liên kết với câu hỏi
                    createdPassages.put(passageIndex, passage);
                    passageIndex++;
                }
            }

            // Map để lưu trữ ID mới của các audio đã tạo
            Map<Integer, ListeningAudio> createdAudios = new HashMap<>();

            // Xử lý Listening Audio nếu là bài thi Listening
            if (request.getListeningAudio() != null && !request.getListeningAudio().isEmpty()) {
                System.out.println("Xử lý " + request.getListeningAudio().size() + " audio...");
                int audioIndex = 1;
                for (ListeningAudioCreateDTO audioDTO : request.getListeningAudio()) {
                    ListeningAudio audio = new ListeningAudio();
                    audio.setTest(test);
                    audio.setTitle(audioDTO.getTitle());
                    audio.setFilePath(audioDTO.getFilePath());
                    audio.setFileType(AudioFileType.valueOf(audioDTO.getFileType()));
                    audio.setTranscript(audioDTO.getTranscript());
                    audio.setSection(ListeningSection.valueOf(audioDTO.getSection()));
                    audio.setOrderInTest(audioDTO.getOrderInTest());

                    // Lưu audio và lấy ID mới
                    audio = listeningAudioService.saveAudio(audio);
                    System.out.println("Đã lưu audio: " + audio.getId() + " - " + audio.getTitle());

                    // Lưu vào map để sử dụng khi liên kết với câu hỏi
                    createdAudios.put(audioIndex, audio);
                    audioIndex++;
                }
            }

            // Xử lý Questions
            if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
                System.out.println("Xử lý " + request.getQuestions().size() + " câu hỏi...");
                for (QuestionCreateDTO questionDTO : request.getQuestions()) {
                    Question question = new Question();
                    question.setTest(test);
                    question.setQuestionText(questionDTO.getQuestionText());
                    question.setQuestionType(QuestionType.valueOf(questionDTO.getQuestionType()));
                    question.setOptions(questionDTO.getOptions());
                    question.setSection(questionDTO.getSection());
                    question.setOrderInTest(questionDTO.getOrderInTest());

                    // Liên kết với passage dựa vào index thay vì ID
                    if (questionDTO.getPassageId() != null) {
                        ReadingPassage passage = createdPassages.get(questionDTO.getPassageId());
                        if (passage != null) {
                            question.setPassage(passage);
                            System.out.println("Đã liên kết câu hỏi với passage ID: " + passage.getId());
                        } else {
                            System.out.println("Không tìm thấy passage với index: " + questionDTO.getPassageId());
                        }
                    }

                    // Liên kết với audio dựa vào index thay vì ID
                    if (questionDTO.getAudioId() != null) {
                        ListeningAudio audio = createdAudios.get(questionDTO.getAudioId());
                        if (audio != null) {
                            question.setAudio(audio);
                            System.out.println("Đã liên kết câu hỏi với audio ID: " + audio.getId());
                        } else {
                            System.out.println("Không tìm thấy audio với index: " + questionDTO.getAudioId());
                        }
                    }

                    try {
                        // Lưu câu hỏi
                        question = questionService.saveQuestion(question);
                        System.out.println("Đã lưu câu hỏi ID: " + question.getId() + " - Type: " + question.getQuestionType());

                        // Lưu đáp án đúng
                        if (questionDTO.getCorrectAnswer() != null) {
                            CorrectAnswer correctAnswer = new CorrectAnswer();
                            correctAnswer.setQuestion(question);
                            correctAnswer.setCorrectAnswerText(questionDTO.getCorrectAnswer());
                            correctAnswer.setExplanation(questionDTO.getExplanation());
                            correctAnswer.setAlternativeAnswers(questionDTO.getAlternativeAnswers());

                            correctAnswerService.saveCorrectAnswer(correctAnswer);
                            System.out.println("Đã lưu đáp án đúng cho câu hỏi ID: " + question.getId());
                        }
                    } catch (Exception e) {
                        System.err.println("Lỗi khi lưu câu hỏi: " + e.getMessage());
                        // Tiếp tục xử lý câu hỏi khác thay vì dừng lại
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("id", test.getId());
            response.put("testName", test.getTestName());
            response.put("message", "Tạo bài thi thành công");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            System.err.println("Lỗi khi tạo bài thi: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tạo bài thi: " + e.getMessage());
        }
    }
}