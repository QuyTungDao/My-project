package tungdao.com.project1.Controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import tungdao.com.project1.dto.*;
import tungdao.com.project1.entity.*;
import tungdao.com.project1.login_register.UserDetailsImpl;
import tungdao.com.project1.mapper.TestAttemptMapper;
import tungdao.com.project1.mapper.TestMapper;
import tungdao.com.project1.repository.ListeningAudioRepository;
import tungdao.com.project1.repository.TestAttemptRepository;
import tungdao.com.project1.repository.TestRepository;
import tungdao.com.project1.repository.UserRepository;
import tungdao.com.project1.service.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

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
    private final ListeningAudioRepository listeningAudioRepository;
    private final TestMapper testMapper;
    private final TestAttemptMapper testAttemptMapper;
    private final ListeningAudioService listeningAudioService;
    private final WritingSpeakingService writingSpeakingService;
    private final AudioProcessingService audioProcessingService;
    private final TestRepository testRepository;
    private final TestAttemptRepository testAttemptRepository;

    public TestController(TestService testService,
                          ReadingPassageService readingPassageService,
                          QuestionService questionService,
                          TestAttemptService testAttemptService,
                          StudentResponseService studentResponseService,
                          CorrectAnswerService correctAnswerService,
                          TestScoreMappingService testScoreMappingService,
                          UserRepository userRepository,
                          TestMapper testMapper,
                          TestAttemptMapper testAttemptMapper,
                          ListeningAudioService listeningAudioService,
                          ListeningAudioRepository listeningAudioRepository,
                          WritingSpeakingService writingSpeakingService,
                          AudioProcessingService audioProcessingService, TestRepository testRepository, TestAttemptRepository testAttemptRepository) {
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
        this.listeningAudioRepository = listeningAudioRepository;
        this.listeningAudioService = listeningAudioService;
        this.writingSpeakingService = writingSpeakingService;
        this.audioProcessingService = audioProcessingService;
        this.testRepository = testRepository;
        this.testAttemptRepository = testAttemptRepository;
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
    // ✅ FIX IN TestController.java - getTestById method
// Replace lines around 120-130 with this corrected version:

    @GetMapping("/{id}")
    public ResponseEntity<?> getTestById(@PathVariable Integer id, HttpServletRequest request) {
        try {
            System.out.println("=== ENHANCED GET TEST BY ID ===");
            System.out.println("Đang lấy thông tin đề thi với ID: " + id);
            Test test = testService.getTestById(id);
            if (test == null) {
                System.out.println("Không tìm thấy bài thi với ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Không tìm thấy bài thi với ID: " + id);
            }

            System.out.println("Đã tìm thấy bài thi: " + test.getTestName());
            System.out.println("Test Type: " + test.getTestType());

            Map<String, Object> response = new HashMap<>();

            // ✅ ENHANCED: Include test type in basic info
            Map<String, Object> testInfo = new HashMap<>();
            testInfo.put("id", test.getId());
            testInfo.put("testName", test.getTestName());
            testInfo.put("testType", test.getTestType() != null ? test.getTestType().toString() : "READING");
            testInfo.put("description", test.getDescription());
            testInfo.put("instructions", test.getInstructions());
            testInfo.put("durationMinutes", test.getDurationMinutes());
            testInfo.put("passingScore", test.getPassingScore());
            testInfo.put("isPractice", test.getIsPractice());
            testInfo.put("isPublished", test.getIsPublished());

            response.put("test", testInfo);
            System.out.println("✅ Added enhanced test info with type: " + test.getTestType());

            // ===== XỬ LÝ READING PASSAGES =====
            System.out.println("Lấy thông tin passages cho xem kết quả...");
            List<ReadingPassage> passages = readingPassageService.getPassagesByTestId(id);
            System.out.println("Số lượng passages: " + passages.size());

            if (passages.size() > 0) {
                List<Map<String, Object>> passageMaps = new ArrayList<>();
                for (ReadingPassage passage : passages) {
                    Map<String, Object> passageMap = new HashMap<>();
                    passageMap.put("id", passage.getId());
                    passageMap.put("title", passage.getTitle());
                    passageMap.put("content", passage.getContent());
                    passageMap.put("orderInTest", passage.getOrderInTest());

                    passageMaps.add(passageMap);

                    System.out.println("✅ Added passage: " + passage.getId() + " - " + passage.getTitle());
                }
                response.put("passages", passageMaps);
                System.out.println("✅ Added " + passageMaps.size() + " passages to response");
            } else {
                response.put("passages", new ArrayList<>());
                System.out.println("⚠️ No passages found, setting empty array");
            }

            // ===== XỬ LÝ LISTENING AUDIO ✅ ALWAYS INCLUDE =====
            System.out.println("=== PROCESSING LISTENING AUDIO (ALWAYS) ===");
            List<ListeningAudio> audioList = listeningAudioService.getAudiosByTestId(id);
            System.out.println("Audio files found: " + audioList.size());

            List<Map<String, Object>> audioMaps = new ArrayList<>();

            if (audioList.size() > 0) {
                for (ListeningAudio audio : audioList) {
                    System.out.println("--- Processing Audio: " + audio.getId() + " ---");

                    Map<String, Object> audioMap = new HashMap<>();
                    audioMap.put("id", audio.getId());
                    audioMap.put("title", audio.getTitle());
                    audioMap.put("section", audio.getSection());
                    audioMap.put("orderInTest", audio.getOrderInTest());
                    audioMap.put("transcript", audio.getTranscript() != null ? audio.getTranscript() : "");
                    audioMap.put("durationSeconds", audio.getDurationSeconds());
                    audioMap.put("fileType", audio.getFileType());

                    // ✅ ENHANCED: Better audio data handling
                    boolean hasBase64 = audio.hasBase64Data();

                    System.out.println("Audio " + audio.getId() + " - hasBase64: " + hasBase64);

                    if (hasBase64) {
                        // ✅ Base64 data available
                        String base64Data = audio.getAudioBase64();
                        String mimeType = audio.getEffectiveMimeType();

                        String dataUrl;
                        if (base64Data.startsWith("data:")) {
                            dataUrl = base64Data;
                        } else {
                            dataUrl = "data:" + mimeType + ";base64," + base64Data;
                        }

                        audioMap.put("audioBase64", dataUrl);
                        audioMap.put("fileUrl", dataUrl); // ✅ Frontend compatibility
                        audioMap.put("mimeType", mimeType);
                        audioMap.put("fileSize", audio.getFileSize());
                        audioMap.put("originalFileName", audio.getOriginalFileName());
                        audioMap.put("storageType", "base64");

                        System.out.println("✅ Audio " + audio.getId() + " mapped with BASE64 data");

                    }
                     else {
                        // ✅ No audio data
                        System.err.println("❌ Audio " + audio.getId() + " has NO AUDIO DATA!");
                        audioMap.put("storageType", "none");
                        audioMap.put("error", "No audio data available");
                        audioMap.put("fileUrl", null);
                        audioMap.put("audioUrl", null);
                    }

                    audioMaps.add(audioMap);
                }
            }

            // ✅ ALWAYS include audio array (even if empty)
            response.put("audio", audioMaps);
            System.out.println("✅ Added " + audioMaps.size() + " audio items to response");

            // ===== XỬ LÝ QUESTIONS WITH ENHANCED MAPPING =====
            System.out.println("Lấy danh sách câu hỏi của bài thi...");
            List<Question> questions = questionService.getQuestionsByTestId(id);
            System.out.println("Số lượng câu hỏi: " + questions.size());

            List<Map<String, Object>> questionMaps = new ArrayList<>();
            for (Question question : questions) {
                Map<String, Object> questionMap = new HashMap<>();
                questionMap.put("id", question.getId());
                questionMap.put("questionText", question.getQuestionText());

                // ✅ ENHANCED: Use same question type mapping as in TestAttemptController
                String questionType = question.getQuestionType() != null ?
                        question.getQuestionType().toString() : "MCQ";

                // Map for frontend consistency
                if (test.getTestType() != null && "LISTENING".equals(test.getTestType().toString())) {
                    switch (questionType) {
                        case "FILL_IN_THE_BLANK":
                            questionType = "LISTENING_FILL_IN_THE_BLANK";
                            break;
                        case "MCQ":
                            questionType = "LISTENING_MCQ";
                            break;
                        case "SHORT_ANSWER":
                            questionType = "LISTENING_SHORT_ANSWER";
                            break;
                        default:
                            questionType = "NOTE_COMPLETION";
                    }
                } else if (question.getAudio() != null) {
                    // Has audio relationship - make it listening type
                    questionType = "NOTE_COMPLETION";
                }

                questionMap.put("questionType", questionType);
                questionMap.put("question_type", questionType); // ✅ Backward compatibility
                questionMap.put("section", question.getSection());
                questionMap.put("orderInTest", question.getOrderInTest());
                questionMap.put("order_in_test", question.getOrderInTest()); // ✅ Backward compatibility
                questionMap.put("options", question.getOptions());
                questionMap.put("questionSetInstructions", question.getQuestionSetInstructions());
                questionMap.put("context", question.getContext());

                if (question.getPassage() != null) {
                    questionMap.put("passageId", question.getPassage().getId());
                }

                if (question.getAudio() != null) {
                    questionMap.put("audioId", question.getAudio().getId());
                }

                questionMaps.add(questionMap);
            }
            response.put("questions", questionMaps);

            System.out.println("=== RESPONSE SUMMARY ===");
            System.out.println("Test Type: " + test.getTestType());
            System.out.println("Passages: " + passages.size());
            System.out.println("Audio: " + audioList.size());
            System.out.println("Questions: " + questions.size());
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
    @Transactional
    @PostMapping("/attempts")
    public ResponseEntity<?> saveTestAttempt(@RequestBody TestAttemptRequest request,
                                             @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("=== ENHANCED TEST ATTEMPT SUBMISSION WITH AUDIO SUPPORT ===");
            System.out.println("Test ID: " + request.getTestId());
            System.out.println("Responses count: " + (request.getResponses() != null ? request.getResponses().size() : "null"));

            // ✅ ENHANCED: Log sample responses with audio detection
            if (request.getResponses() != null && !request.getResponses().isEmpty()) {
                int audioCount = 0;
                int textCount = 0;

                for (int i = 0; i < Math.min(3, request.getResponses().size()); i++) {
                    TestAttemptRequest.ResponseData resp = request.getResponses().get(i);
                    boolean hasAudio = resp.getAudioResponse() != null && !resp.getAudioResponse().trim().isEmpty();
                    boolean hasText = resp.getResponseText() != null && !resp.getResponseText().trim().isEmpty();

                    System.out.println("Sample Response " + (i+1) + ": Q" + resp.getQuestionId() +
                            " - Text: " + (hasText ? "YES" : "NO") +
                            " - Audio: " + (hasAudio ? "YES (" + resp.getAudioResponse().length() + " chars)" : "NO"));

                    if (hasAudio) audioCount++;
                    if (hasText) textCount++;
                }

                System.out.println("Response summary: " + textCount + " text, " + audioCount + " audio responses detected");
            }

            // Authentication logic (giữ nguyên như cũ)
            Integer studentId;
            if (userDetails == null) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                System.out.println("Authentication từ context: " + (authentication != null ? authentication.getName() : "null"));

                if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
                    userDetails = (UserDetailsImpl) authentication.getPrincipal();
                    studentId = userDetails.getId();
                    System.out.println("Lấy được user ID từ SecurityContext: " + studentId);
                } else {
                    System.err.println("Không xác định được người dùng đã đăng nhập");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body("Vui lòng đăng nhập để lưu kết quả bài thi");
                }
            } else {
                studentId = userDetails.getId();
                System.out.println("User ID từ tham số: " + studentId);
            }

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

            System.out.println("Tìm thấy đề thi: " + test.getTestName() + " (Type: " + test.getTestType() + ")");

            // Create and save test attempt
            TestAttempt attempt = new TestAttempt();
            attempt.setStudent(student);
            attempt.setTest(test);
            attempt.setStartTime(LocalDateTime.now());
            attempt.setIsCompleted(true);
            attempt = testAttemptService.saveTestAttempt(attempt);
            System.out.println("✅ Đã lưu test attempt với ID: " + attempt.getId());

            // ✅ ENHANCED: Process responses with audio support
            System.out.println("=== ENHANCED RESPONSE PROCESSING WITH AUDIO SUPPORT ===");
            Map<String, Integer> scores = new HashMap<>();
            List<StudentResponse> savedResponses = new ArrayList<>();

            int totalProcessed = 0;
            int totalCorrect = 0;
            int totalIncorrect = 0;
            int totalSkipped = 0;
            int totalAudioResponses = 0;
            int totalTextResponses = 0;

            // ✅ FIXED VERSION: Replace the problematic section in TestController.java

            for (TestAttemptRequest.ResponseData responseData : request.getResponses()) {
                totalProcessed++;

                System.out.println("--- Processing Response " + totalProcessed + " ---");
                System.out.println("Question ID: " + responseData.getQuestionId());

                Question question = questionService.getQuestionById(responseData.getQuestionId());
                if (question == null) {
                    System.out.println("❌ Question not found: " + responseData.getQuestionId());
                    totalSkipped++;
                    continue;
                }

                System.out.println("Question Type: " + question.getQuestionType());
                System.out.println("Test Type: " + question.getTest().getTestType());

                // ✅ CREATE StudentResponse OBJECT FIRST (before checking response types)
                StudentResponse response = new StudentResponse();
                response.setAttempt(attempt);
                response.setStudent(student);
                response.setQuestion(question);
                response.setSubmittedAt(LocalDateTime.now());

                // ✅ CHECK RESPONSE TYPE - Support both text and audio
                boolean hasTextResponse = responseData.getResponseText() != null &&
                        !responseData.getResponseText().trim().isEmpty();
                boolean hasAudioResponse = responseData.getAudioResponse() != null &&
                        !responseData.getAudioResponse().trim().isEmpty();

                System.out.println("Has text response: " + hasTextResponse);
                System.out.println("Has audio response: " + hasAudioResponse);

                if (hasTextResponse) {
                    System.out.println("Response Text: '" + responseData.getResponseText() + "'");
                    totalTextResponses++;
                }

                // ✅ HANDLE TEXT RESPONSES (Reading, Listening, Writing)
                if (hasTextResponse) {
                    response.setResponseText(responseData.getResponseText());

                    // Calculate word count for writing tasks
                    if (isWritingQuestion(question.getQuestionType())) {
                        int wordCount = countWords(responseData.getResponseText());
                        response.setWordCount(wordCount);
                        System.out.println("Word count: " + wordCount);
                    }

                    // ✅ CHECK IF OBJECTIVE QUESTION (auto-gradable)
                    if (isObjectiveQuestion(question.getQuestionType())) {
                        // Check answer for objective questions
                        CorrectAnswer correctAnswer = correctAnswerService.getByQuestionId(question.getId());
                        if (correctAnswer != null) {
                            System.out.println("Correct Answer: '" + correctAnswer.getCorrectAnswerText() + "'");

                            boolean isCorrect = checkAnswer(responseData.getResponseText(), correctAnswer);
                            response.setIsCorrect(isCorrect);

                            System.out.println("Check Result: " + (isCorrect ? "✅ CORRECT" : "❌ INCORRECT"));

                            String testType = question.getTest().getTestType().name().toLowerCase();
                            scores.putIfAbsent(testType, 0);

                            if (isCorrect) {
                                scores.put(testType, scores.get(testType) + 1);
                                totalCorrect++;
                                System.out.println("✅ Incremented " + testType + " to: " + scores.get(testType));
                            } else {
                                totalIncorrect++;
                                System.out.println("❌ Wrong answer, " + testType + " remains: " + scores.get(testType));
                            }
                        } else {
                            System.out.println("⚠️ No correct answer found for Q" + question.getId());
                            response.setIsCorrect(false);
                            totalSkipped++;
                        }
                    } else {
                        // ✅ SUBJECTIVE QUESTIONS (Writing/Essay) - need manual grading
                        response.setIsCorrect(null); // Will be graded manually
                        System.out.println("📝 Subjective question - will be graded manually");
                    }
                }

                // ✅ ENHANCED AUDIO HANDLING for Speaking Tests
                if (hasAudioResponse) {
                    try {
                        System.out.println("=== PROCESSING AUDIO RESPONSE ===");
                        System.out.println("Audio Response: " + responseData.getAudioResponse().length() + " characters");
                        System.out.println("Audio Duration: " + responseData.getAudioDuration() + " seconds");
                        System.out.println("Audio File Type: " + responseData.getAudioFileType());

                        // ✅ USE AudioProcessingService for validation and processing
                        StudentResponseDTO audioDTO = convertToStudentResponseDTO(responseData);
                        AudioProcessingService.AudioProcessingResult audioResult =
                                audioProcessingService.processAudioResponse(audioDTO);

                        if (!audioResult.success) {
                            System.err.println("❌ Audio processing failed: " + audioResult.error);
                            throw new RuntimeException("Audio processing failed for question " +
                                    question.getId() + ": " + audioResult.error);
                        }

                        System.out.println("✅ Audio processing successful: " + audioResult);

                        // ✅ APPLY PROCESSED AUDIO DATA to response
                        audioProcessingService.applyAudioData(response, audioResult);

                        // ✅ SET RESPONSE TYPE for Speaking
                        response.setResponseType(ResponseType.AUDIO);

                        System.out.println("✅ Audio response processed successfully:");
                        System.out.println("  - Duration: " + audioResult.duration + " seconds");
                        System.out.println("  - File type: " + audioResult.fileType);
                        System.out.println("  - File size: " + audioResult.actualFileSize + " bytes");
                        System.out.println("  - MIME type: " + audioResult.mimeType);

                        // ✅ SPEAKING responses need manual grading
                        response.setIsCorrect(null); // Will be graded manually
                        System.out.println("🎤 Speaking response saved - requires manual grading");

                        totalAudioResponses++;

                    } catch (Exception audioError) {
                        System.err.println("❌ Critical error processing audio for Q" + question.getId() + ": " + audioError.getMessage());
                        audioError.printStackTrace();
                        throw new RuntimeException("Failed to process audio for question " + question.getId() +
                                ": " + audioError.getMessage(), audioError);
                    }
                }

                // ✅ VALIDATION: Must have either text or audio response
                if (!hasTextResponse && !hasAudioResponse) {
                    System.out.println("⚠️ Question " + question.getId() + " has no response, skipping");
                    totalSkipped++;
                    continue;
                }

                // ✅ SAVE RESPONSE with enhanced error handling
                try {
                    StudentResponse savedResponse = studentResponseService.saveStudentResponse(response);
                    savedResponses.add(savedResponse);
                    System.out.println("✅ Saved response ID: " + savedResponse.getId());

                    // ✅ VERIFY AUDIO SAVE for debugging
                    if (hasAudioResponse && savedResponse.getAudioBase64() != null) {
                        System.out.println("✅ Audio verified in database: " +
                                savedResponse.getAudioBase64().length() + " chars");
                    }

                } catch (Exception e) {
                    System.err.println("❌ Error saving response for Q" + question.getId() + ": " + e.getMessage());
                    e.printStackTrace();
                    throw new RuntimeException("Error saving response: " + e.getMessage(), e);
                }
            }

// ✅ ADD AUDIO PROCESSING SUMMARY after the loop
            if (totalAudioResponses > 0) {
                System.out.println("=== AUDIO PROCESSING SUMMARY ===");
                Map<String, Object> audioStats = audioProcessingService.getAudioStatistics(savedResponses);
                audioStats.forEach((key, value) ->
                        System.out.println(key + ": " + value));
            }

            // ✅ PROCESSING SUMMARY
            System.out.println("=== ENHANCED PROCESSING SUMMARY ===");
            System.out.println("Total Processed: " + totalProcessed);
            System.out.println("Text Responses: " + totalTextResponses);
            System.out.println("Audio Responses: " + totalAudioResponses);
            System.out.println("Auto-scored Correct: " + totalCorrect);
            System.out.println("Auto-scored Incorrect: " + totalIncorrect);
            System.out.println("Skipped: " + totalSkipped);
            System.out.println("Objective scores by type: " + scores);

            // ✅ SCORING: Only calculate for objective questions
            Map<String, BigDecimal> ieltsScores = new HashMap<>();
            boolean requiresManualGrading = totalAudioResponses > 0 ||
                    test.getTestType() == TestType.WRITING ||
                    test.getTestType() == TestType.SPEAKING;

            if (!scores.isEmpty()) {
                // Calculate scores for objective questions
                System.out.println("=== CALCULATING IELTS SCORES FOR OBJECTIVE QUESTIONS ===");
                ieltsScores = calculateIELTSScores(scores);
                System.out.println("Calculated IELTS Scores: " + ieltsScores);
            } else {
                System.out.println("=== NO OBJECTIVE SCORES TO CALCULATE ===");
                // For pure Speaking/Writing tests, set default scores (to be updated after manual grading)
                ieltsScores.put("total", BigDecimal.ZERO);

                if (test.getTestType() == TestType.SPEAKING) {
                    ieltsScores.put("speaking", BigDecimal.ZERO);
                    System.out.println("✅ Set default speaking score to 0 (pending manual grading)");
                } else if (test.getTestType() == TestType.WRITING) {
                    ieltsScores.put("writing", BigDecimal.ZERO);
                    System.out.println("✅ Set default writing score to 0 (pending manual grading)");
                }
            }

            // ✅ UPDATE ATTEMPT SCORES
            updateTestAttemptScores(attempt, ieltsScores);

            // ✅ VERIFICATION
            TestAttempt finalAttempt = testAttemptService.getTestAttemptById(attempt.getId());
            System.out.println("=== VERIFICATION ===");
            System.out.println("Final Total Score: " + finalAttempt.getTotalScore());
            System.out.println("Final Responses Count: " + (finalAttempt.getResponses() != null ? finalAttempt.getResponses().size() : "null"));

            if (finalAttempt.getResponses() != null && !finalAttempt.getResponses().isEmpty()) {
                StudentResponse firstResponse = finalAttempt.getResponses().iterator().next();
                System.out.println("Sample saved response: Q" +
                        firstResponse.getQuestion().getId() +
                        " - Text: '" + firstResponse.getResponseText() + "'" +
                        " - Audio: " + (firstResponse.getAudioBase64() != null ? "YES" : "NO") +
                        " - Correct: " + firstResponse.getIsCorrect());
            }

            // ✅ ENHANCED RESPONSE
            Map<String, Object> result = new HashMap<>();
            result.put("attemptId", attempt.getId());
            result.put("scores", ieltsScores);
            result.put("totalQuestions", request.getResponses().size());
            result.put("textResponses", totalTextResponses);
            result.put("audioResponses", totalAudioResponses);
            result.put("autoScoredCorrect", totalCorrect);
            result.put("requiresManualGrading", requiresManualGrading);
            result.put("correctAnswers", scores); // For backward compatibility

            if (requiresManualGrading) {
                result.put("message", "Test submitted successfully. " +
                        (totalAudioResponses > 0 ? "Audio responses" : "Written responses") +
                        " will be graded manually by instructors.");
            }

            System.out.println("✅ SUCCESS - Attempt ID: " + attempt.getId());
            System.out.println("Requires manual grading: " + requiresManualGrading);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("❌ ERROR in enhanced saveTestAttempt: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lưu kết quả: " + e.getMessage());
        }
    }

    private StudentResponseDTO convertToStudentResponseDTO(TestAttemptRequest.ResponseData responseData) {
        StudentResponseDTO dto = new StudentResponseDTO();
        dto.setQuestionId(responseData.getQuestionId());
        dto.setResponseText(responseData.getResponseText());
        dto.setAudioResponse(responseData.getAudioResponse());
        dto.setAudioDuration(responseData.getAudioDuration());
        dto.setAudioFileType(responseData.getAudioFileType());
        return dto;
    }

    private boolean isObjectiveQuestion(QuestionType questionType) {
        switch (questionType) {
            // ✅ AUTO-GRADABLE (Objective questions)
            case MCQ:
            case MATCHING:
            case FILL_IN_THE_BLANK:
            case TRUE_FALSE_NOT_GIVEN:
            case SHORT_ANSWER:
            case NOTE_COMPLETION:
            case FORM_FILLING:
            case TABLE_COMPLETION:
            case PLAN_MAP_COMPLETION:
            case SENTENCE_COMPLETION:
            case SUMMARY_COMPLETION:
            case DIAGRAM_LABELLING:
                return true;

            // ✅ MANUAL GRADING REQUIRED (Subjective questions)
            case ESSAY:
            case WRITING_TASK1_ACADEMIC:
            case WRITING_TASK1_GENERAL:
            case WRITING_TASK2:
            case SPEAKING_TASK:
            case SPEAKING_PART1:
            case SPEAKING_PART2:
            case SPEAKING_PART3:
            case FLEXIBLE_CONTEXT:
                return false;

            default:
                System.out.println("⚠️ Unknown question type for grading: " + questionType + ", treating as objective");
                return true; // Default to objective for safety
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
        System.out.println("=== CALCULATE IELTS SCORES DEBUG ===");
        System.out.println("Input: " + correctAnswerCounts);

        Map<String, BigDecimal> ieltsScores = new HashMap<>();

        for (Map.Entry<String, Integer> entry : correctAnswerCounts.entrySet()) {
            String testType = entry.getKey();
            Integer correctCount = entry.getValue();

            System.out.println("--- Processing " + testType + " ---");
            System.out.println("Correct count: " + correctCount);

            // ✅ CRITICAL FIX: Handle zero correct answers FIRST
            if (correctCount == null || correctCount <= 0) {
                System.out.println("✅ Zero or null correct answers, setting score to 0");
                ieltsScores.put(testType, BigDecimal.ZERO);
                continue; // ← Skip calling mapping service for zero
            }

            // Only call mapping service for non-zero counts
            System.out.println("Calling mapping service for " + testType + " with " + correctCount + " correct");

            BigDecimal ieltsScore;
            try {
                ieltsScore = testScoreMappingService.getIELTSScore(testType, correctCount);
                System.out.println("Mapping service returned: " + ieltsScore);

                // ✅ ADDITIONAL VALIDATION: Even if mapping returns something, validate it
                if (ieltsScore == null) {
                    System.err.println("❌ Mapping service returned null, using 0");
                    ieltsScore = BigDecimal.ZERO;
                } else if (ieltsScore.compareTo(BigDecimal.ZERO) < 0) {
                    System.err.println("❌ Mapping service returned negative score, using 0");
                    ieltsScore = BigDecimal.ZERO;
                }

            } catch (Exception e) {
                System.err.println("❌ ERROR calling mapping service: " + e.getMessage());
                ieltsScore = BigDecimal.ZERO;
            }

            ieltsScores.put(testType, ieltsScore);
            System.out.println("✅ Final score for " + testType + ": " + ieltsScore);
        }

        // Calculate total - only include non-total scores
        System.out.println("--- Calculating Total ---");
        List<BigDecimal> skillScores = ieltsScores.entrySet().stream()
                .filter(entry -> !"total".equals(entry.getKey()))
                .map(Map.Entry::getValue)
                .filter(score -> score != null)
                .collect(java.util.stream.Collectors.toList());

        if (!skillScores.isEmpty()) {
            double totalScore = skillScores.stream()
                    .mapToDouble(BigDecimal::doubleValue)
                    .average()
                    .orElse(0.0);

            if (totalScore < 0) totalScore = 0.0;

            ieltsScores.put("total", BigDecimal.valueOf(totalScore));
            System.out.println("✅ Total score: " + totalScore);
        } else {
            ieltsScores.put("total", BigDecimal.ZERO);
            System.out.println("No skill scores, total = 0");
        }

        System.out.println("=== FINAL SCORES ===");
        ieltsScores.forEach((skill, score) ->
                System.out.println(skill + ": " + score));

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
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> createTest(@RequestBody TestCreateRequest request,
                                        @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("=== ENHANCED TEST CREATION WITH WRITING/SPEAKING SUPPORT ===");
            System.out.println("Test Type: " + request.getTestType());
            System.out.println("Questions count: " + (request.getQuestions() != null ? request.getQuestions().size() : 0));

            // Debug số lượng câu hỏi
            if (request.getQuestions() != null) {
                System.out.println("Số lượng câu hỏi: " + request.getQuestions().size());
            }

            // Xử lý authentication
            Integer creatorId;
            if (userDetails == null) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                System.out.println("Authentication từ context: " + (authentication != null ? authentication.getName() : "null"));

                if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
                    userDetails = (UserDetailsImpl) authentication.getPrincipal();
                    creatorId = userDetails.getId();
                    System.out.println("Lấy được user ID từ SecurityContext: " + creatorId);
                } else {
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
            System.out.println("✅ Created " + test.getTestType() + " test with ID: " + test.getId());

            // ✅ HANDLE DIFFERENT TEST TYPES
            String testType = request.getTestType();

            if ("WRITING".equals(testType) || "SPEAKING".equals(testType)) {
                // ✅ WRITING/SPEAKING: Process questions with enhanced fields
                processWritingSpeakingQuestions(test, request.getQuestions());

            } else if ("READING".equals(testType)) {
                // ✅ READING: Process passages and questions
                Map<Integer, ReadingPassage> createdPassages = processReadingPassages(test, request.getReadingPassages());
                processReadingQuestions(test, request.getQuestions(), createdPassages);

            } else if ("LISTENING".equals(testType)) {
                // ✅ LISTENING: Process audio and questions
                Map<Integer, ListeningAudio> createdAudios = processListeningAudio(test, request.getListeningAudio());
                processListeningQuestions(test, request.getQuestions(), createdAudios);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("id", test.getId());
            response.put("testName", test.getTestName());
            response.put("testType", test.getTestType().toString());
            response.put("message", "Created " + test.getTestType() + " test successfully");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            System.err.println("❌ Error creating " + (request != null ? request.getTestType() : "unknown") + " test: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating test: " + e.getMessage());
        }
    }



    @PostMapping("/{id}/delete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTest(@PathVariable Integer id,
                                        @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("=== DELETE TEST WITH ROLE CHECK ===");
            System.out.println("Đang xử lý yêu cầu xóa bài thi với ID: " + id);
            System.out.println("Requested by user: " + userDetails.getUsername());

            // Kiểm tra xem bài thi có tồn tại không
            Test test = testService.getTestById(id);
            if (test == null) {
                System.out.println("Không tìm thấy bài thi với ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Không tìm thấy bài thi với ID: " + id);
            }

            System.out.println("Đã tìm thấy bài thi: " + test.getTestName());
            System.out.println("Tác giả bài thi: " + (test.getCreator() != null ? test.getCreator().getEmail() : "Unknown"));

            // ✅ OWNERSHIP CHECK: Only creator or admin can delete
            User currentUser = userRepository.findById(userDetails.getId()).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Không tìm thấy thông tin người dùng");
            }

            boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
            boolean isCreator = test.getCreator() != null &&
                    test.getCreator().getId().equals(userDetails.getId());

            if (!isAdmin && !isCreator) {
                System.out.println("❌ Access denied: User " + currentUser.getEmail() +
                        " (role: " + currentUser.getRole() + ") tried to delete test " + id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Bạn chỉ có thể xóa bài thi do chính bạn tạo ra (trừ khi bạn là Admin)");
            }

            System.out.println("✅ Permission granted: " +
                    (isAdmin ? "Admin access" : "Creator access"));

            // Xóa bài thi
            testService.deleteTest(id);
            System.out.println("Đã xóa bài thi thành công");

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bài thi đã được xóa thành công");
            response.put("testId", id);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Lỗi khi xóa bài thi: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi xóa bài thi: " + e.getMessage());
        }
    }

    // =====================================
// 🚨 THAY THẾ HOÀN TOÀN method getMyTests() trong TestController.java
// =====================================

    @GetMapping("/my-tests")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> getMyTests(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("=== GETTING MY TESTS (SIMPLE & WORKING) ===");
            System.out.println("User ID: " + userDetails.getId());
            System.out.println("Username: " + userDetails.getUsername());

            User currentUser = userRepository.findById(userDetails.getId()).orElse(null);
            if (currentUser == null) {
                System.err.println("❌ User not found with ID: " + userDetails.getId());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", true, "message", "User not found"));
            }

            System.out.println("✅ Found user: " + currentUser.getEmail() + " (Role: " + currentUser.getRole() + ")");

            List<Test> userTests = new ArrayList<>();

            // ✅ SIMPLE: Use working repository methods only
            if (currentUser.getRole() == UserRole.ADMIN) {
                System.out.println("🔑 Admin access - getting all tests");
                userTests = testRepository.findAll();

            } else if (currentUser.getRole() == UserRole.TEACHER) {
                System.out.println("👨‍🏫 Teacher access - getting own tests");

                // ✅ USE ONLY WORKING METHODS
                userTests = testRepository.findByCreator(currentUser);
                System.out.println("📝 Found " + userTests.size() + " tests by creator");

                // ✅ FALLBACK: Try by creator ID if empty
                if (userTests.isEmpty()) {
                    userTests = testRepository.findByCreatorId(currentUser.getId());
                    System.out.println("📝 Fallback: Found " + userTests.size() + " tests by creator ID");
                }

            } else {
                System.err.println("❌ Invalid role: " + currentUser.getRole());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", true, "message", "Access denied: Invalid role"));
            }

            System.out.println("✅ Total tests found: " + userTests.size());

            // ✅ SIMPLE DTO CONVERSION (no complex grading info for now)
            List<Map<String, Object>> testDTOs = new ArrayList<>();

            for (Test test : userTests) {
                try {
                    Map<String, Object> dto = new HashMap<>();

                    // Basic test info
                    dto.put("id", test.getId());
                    dto.put("testName", test.getTestName() != null ? test.getTestName() : "Unnamed Test");
                    dto.put("testType", test.getTestType() != null ? test.getTestType().toString() : "READING");
                    dto.put("description", test.getDescription() != null ? test.getDescription() : "");
                    dto.put("durationMinutes", test.getDurationMinutes() != null ? test.getDurationMinutes() : 60);
                    dto.put("passingScore", test.getPassingScore() != null ? test.getPassingScore() : BigDecimal.valueOf(5.0));
                    dto.put("isPublished", test.getIsPublished() != null ? test.getIsPublished() : false);
                    dto.put("createdAt", test.getCreatedAt());
                    dto.put("updatedAt", test.getUpdatedAt());

                    // Creator info
                    if (test.getCreator() != null) {
                        dto.put("creatorName", test.getCreator().getFullName());
                        dto.put("creatorEmail", test.getCreator().getEmail());
                    }

                    // ✅ SIMPLE: Basic submission count (no complex grading stats)
                    int totalSubmissions = 0;
                    try {
                        List<TestAttempt> attempts = testAttemptRepository.findByTestIdOrderByEndTimeDesc(test.getId());
                        totalSubmissions = attempts.size();
                    } catch (Exception e) {
                        System.err.println("⚠️ Could not get attempts for test " + test.getId() + ": " + e.getMessage());
                    }

                    dto.put("totalSubmissions", totalSubmissions);
                    dto.put("pendingSubmissions", 0); // Will be calculated later if needed

                    testDTOs.add(dto);

                    System.out.println("✅ Processed test: " + test.getId() + " - " + test.getTestName());

                } catch (Exception testError) {
                    System.err.println("❌ Error processing test " + test.getId() + ": " + testError.getMessage());
                    // Continue with next test
                }
            }

            // ✅ SORT BY CREATION DATE (newest first)
            testDTOs.sort((a, b) -> {
                LocalDateTime dateA = (LocalDateTime) a.get("createdAt");
                LocalDateTime dateB = (LocalDateTime) b.get("createdAt");

                if (dateA == null && dateB == null) return 0;
                if (dateA == null) return 1;
                if (dateB == null) return -1;
                return dateB.compareTo(dateA);
            });

            System.out.println("=== SUCCESS RESPONSE ===");
            System.out.println("✅ Returning " + testDTOs.size() + " tests");
            System.out.println("User role: " + currentUser.getRole());

            return ResponseEntity.ok(testDTOs);

        } catch (Exception e) {
            System.err.println("❌ CRITICAL ERROR in getMyTests: " + e.getMessage());
            e.printStackTrace();

            // ✅ DETAILED ERROR RESPONSE
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", "Error getting tests: " + e.getMessage());
            errorResponse.put("type", e.getClass().getSimpleName());
            errorResponse.put("userId", userDetails != null ? userDetails.getId() : "unknown");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ✅ ADD new endpoint for admin to manage all tests
    @GetMapping("/admin/all-tests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllTestsForAdmin(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("=== ADMIN: GET ALL TESTS ===");
            System.out.println("Requested by admin: " + userDetails.getUsername());

            List<Test> allTests = testService.getAllTests();
            List<TestDTO> testDTOs = testMapper.toDTOList(allTests);

            // ✅ Add detailed creator info for admin
            for (TestDTO testDTO : testDTOs) {
                Test originalTest = allTests.stream()
                        .filter(t -> t.getId().equals(testDTO.getId()))
                        .findFirst()
                        .orElse(null);

                if (originalTest != null && originalTest.getCreator() != null) {
                    testDTO.setCreatorName(originalTest.getCreator().getFullName());
                    testDTO.setCreatorEmail(originalTest.getCreator().getEmail());
                    testDTO.setCreatorRole(originalTest.getCreator().getRole().toString());
                }
            }

            System.out.println("✅ Admin retrieved " + testDTOs.size() + " tests");
            return ResponseEntity.ok(testDTOs);
        } catch (Exception e) {
            System.err.println("Error getting all tests for admin: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lấy tất cả bài thi: " + e.getMessage());
        }
    }

    @GetMapping("/correct-answer/{questionId}")
    public ResponseEntity<?> getCorrectAnswerByQuestionId(@PathVariable Integer questionId) {
        try {
            System.out.println("Đang lấy đáp án đúng cho câu hỏi ID: " + questionId);

            CorrectAnswer correctAnswer = correctAnswerService.getByQuestionId(questionId);
            if (correctAnswer == null) {
                System.out.println("Không tìm thấy đáp án đúng cho câu hỏi ID: " + questionId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Không tìm thấy đáp án đúng cho câu hỏi ID: " + questionId);
            }

            // Tạo DTO để trả về thông tin cần thiết
            Map<String, Object> response = new HashMap<>();
            response.put("id", correctAnswer.getId());
            response.put("questionId", correctAnswer.getQuestion().getId());
            response.put("correctAnswerText", correctAnswer.getCorrectAnswerText());
            response.put("explanation", correctAnswer.getExplanation());
            response.put("alternativeAnswers", correctAnswer.getAlternativeAnswers());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy đáp án đúng: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lấy đáp án đúng: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/update")
    @Transactional
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateTest(@PathVariable Integer id,
                                        @RequestBody TestCreateRequest request,
                                        @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("=== ENHANCED TEST UPDATE WITH WRITING/SPEAKING SUPPORT ===");
            System.out.println("Test ID: " + id);
            System.out.println("Test Type: " + request.getTestType());

            // Authentication and permission checks
            Integer userId;
            if (userDetails == null) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
                    userDetails = (UserDetailsImpl) authentication.getPrincipal();
                    userId = userDetails.getId();
                } else {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body("Vui lòng đăng nhập để cập nhật bài thi");
                }
            } else {
                userId = userDetails.getId();
            }

            Test existingTest = testService.getTestById(id);
            if (existingTest == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Không tìm thấy bài thi với ID: " + id);
            }

            User currentUser = userRepository.findById(userDetails.getId()).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Không tìm thấy thông tin người dùng");
            }

            boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
            boolean isCreator = existingTest.getCreator() != null &&
                    existingTest.getCreator().getId().equals(userDetails.getId());

            if (!isAdmin && !isCreator) {
                System.out.println("❌ Access denied: User " + currentUser.getEmail() +
                        " (role: " + currentUser.getRole() + ") tried to update test " + id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Bạn chỉ có thể cập nhật bài thi do chính bạn tạo ra (trừ khi bạn là Admin)");
            }

            // Update basic test info
            existingTest.setTestName(request.getTestName());
            existingTest.setTestType(TestType.valueOf(request.getTestType()));
            existingTest.setDescription(request.getDescription());
            existingTest.setInstructions(request.getInstructions());
            existingTest.setDurationMinutes(request.getDurationMinutes());
            existingTest.setPassingScore(request.getPassingScore());
            existingTest.setIsPractice(request.getIsPractice());
            existingTest.setIsPublished(request.getIsPublished());

            Test updatedTest = testService.saveTest(existingTest);

            // ✅ CLEAN UP: Delete existing related data
            testService.deleteRelatedData(id);

            // ✅ HANDLE DIFFERENT TEST TYPES FOR UPDATE
            String testType = request.getTestType();

            if ("WRITING".equals(testType) || "SPEAKING".equals(testType)) {
                // ✅ WRITING/SPEAKING UPDATE: Process questions with enhanced fields
                processWritingSpeakingQuestions(updatedTest, request.getQuestions());

            } else if ("READING".equals(testType)) {
                // ✅ READING UPDATE: Process passages and questions
                Map<Integer, ReadingPassage> createdPassages = processReadingPassages(updatedTest, request.getReadingPassages());
                processReadingQuestions(updatedTest, request.getQuestions(), createdPassages);

            } else if ("LISTENING".equals(testType)) {
                // ✅ LISTENING UPDATE: Process audio and questions
                Map<Integer, ListeningAudio> createdAudios = processListeningAudio(updatedTest, request.getListeningAudio());
                processListeningQuestions(updatedTest, request.getQuestions(), createdAudios);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("id", updatedTest.getId());
            response.put("testName", updatedTest.getTestName());
            response.put("testType", updatedTest.getTestType().toString());
            response.put("message", "Updated " + updatedTest.getTestType() + " test successfully");

            System.out.println("✅ " + testType + " test update completed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Error updating " + request.getTestType() + " test: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating test: " + e.getMessage());
        }
    }

    private void processWritingSpeakingQuestions(Test test, List<QuestionCreateDTO> questionDTOs) {
        if (questionDTOs == null || questionDTOs.isEmpty()) {
            System.out.println("⚠️ No " + test.getTestType() + " questions provided");
            return;
        }

        System.out.println("=== PROCESSING " + test.getTestType() + " QUESTIONS ===");
        System.out.println("Questions count: " + questionDTOs.size());

        for (QuestionCreateDTO questionDTO : questionDTOs) {
            try {
                System.out.println("--- Processing " + test.getTestType() + " Question ---");
                System.out.println("Frontend type: '" + questionDTO.getQuestionType() + "'");

                Question question = new Question();
                question.setTest(test);
                question.setQuestionText(questionDTO.getQuestionText());

                // ✅ SIMPLE: Single mapping call
                QuestionType mappedType = mapQuestionType(questionDTO.getQuestionType());
                question.setQuestionType(mappedType);
                System.out.println("✅ Mapped to: " + mappedType);

                question.setOrderInTest(questionDTO.getOrderInTest() != null ? questionDTO.getOrderInTest() : 0);
                question.setQuestionSetInstructions(questionDTO.getQuestionSetInstructions());
                question.setContext(questionDTO.getContext());


                // Save question
                question = questionService.saveQuestion(question);
                System.out.println("✅ Saved " + test.getTestType() + " question: " + question.getId());

                // Save assessment criteria
                if (questionDTO.getCorrectAnswer() != null && !questionDTO.getCorrectAnswer().trim().isEmpty()) {
                    CorrectAnswer correctAnswer = new CorrectAnswer();
                    correctAnswer.setQuestion(question);
                    correctAnswer.setCorrectAnswerText(questionDTO.getCorrectAnswer());
                    correctAnswer.setExplanation(questionDTO.getExplanation());
                    correctAnswer.setAlternativeAnswers(questionDTO.getAlternativeAnswers());

                    correctAnswerService.saveCorrectAnswer(correctAnswer);
                    System.out.println("✅ Saved assessment criteria");
                }

            } catch (Exception e) {
                System.err.println("❌ Error saving " + test.getTestType() + " question:");
                System.err.println("  - Frontend type: " + questionDTO.getQuestionType());
                System.err.println("  - Error: " + e.getMessage());

                if (e.getMessage().contains("Data truncated")) {
                    QuestionType mapped = mapQuestionType(questionDTO.getQuestionType());
                    System.err.println("  - Mapped enum: " + mapped);
                    System.err.println("  - Enum string: '" + mapped.toString() + "'");
                    System.err.println("  - Enum length: " + mapped.toString().length());
                }

                throw new RuntimeException("Error saving question: " + e.getMessage(), e);
            }
        }

        System.out.println("=== COMPLETED " + test.getTestType() + " QUESTIONS PROCESSING ===");
    }

    // ✅ HELPER METHOD: Process Reading passages
    private Map<Integer, ReadingPassage> processReadingPassages(Test test, List<ReadingPassageCreateDTO> passageDTOs) {
        Map<Integer, ReadingPassage> createdPassages = new HashMap<>();

        if (passageDTOs != null && !passageDTOs.isEmpty()) {
            System.out.println("Xử lý " + passageDTOs.size() + " đoạn văn...");
            int passageIndex = 1;
            for (ReadingPassageCreateDTO passageDTO : passageDTOs) {
                ReadingPassage passage = new ReadingPassage();
                passage.setTest(test);
                passage.setTitle(passageDTO.getTitle());
                passage.setContent(passageDTO.getContent());
                passage.setOrderInTest(passageDTO.getOrderInTest());

                passage = readingPassageService.savePassage(passage);
                System.out.println("Đã lưu passage: " + passage.getId() + " - " + passage.getTitle());

                createdPassages.put(passageIndex, passage);
                passageIndex++;
            }
        }

        return createdPassages;
    }

    // ✅ HELPER METHOD: Process Reading questions
    private void processReadingQuestions(Test test, List<QuestionCreateDTO> questionDTOs, Map<Integer, ReadingPassage> createdPassages) {
        if (questionDTOs == null || questionDTOs.isEmpty()) {
            System.out.println("⚠️ No questions provided in request");
            return;
        }

        System.out.println("=== PROCESSING READING QUESTIONS ===");
        System.out.println("Số lượng câu hỏi: " + questionDTOs.size());

        for (QuestionCreateDTO questionDTO : questionDTOs) {
            Question question = new Question();
            question.setTest(test);
            question.setQuestionText(questionDTO.getQuestionText());
            question.setQuestionType(QuestionType.valueOf(questionDTO.getQuestionType()));
            question.setOptions(questionDTO.getOptions());
            question.setSection(questionDTO.getSection());
            question.setOrderInTest(questionDTO.getOrderInTest() != null ? questionDTO.getOrderInTest() : 0);
            question.setQuestionSetInstructions(questionDTO.getQuestionSetInstructions());
            question.setContext(questionDTO.getContext());

            // ✅ LINK WITH PASSAGE
            if (questionDTO.getPassageId() != null) {
                int passageIndex = questionDTO.getPassageId();
                ReadingPassage linkedPassage = createdPassages.get(passageIndex);

                if (linkedPassage != null) {
                    question.setPassage(linkedPassage);
                    System.out.println("✅ Linked question with passage: UI index " + passageIndex +
                            " -> DB ID " + linkedPassage.getId());
                } else {
                    System.out.println("❌ Cannot find passage for UI index: " + passageIndex);
                }
            }

            try {
                question = questionService.saveQuestion(question);
                System.out.println("✅ Saved question: " + question.getId());

                if (questionDTO.getCorrectAnswer() != null && !questionDTO.getCorrectAnswer().trim().isEmpty()) {
                    CorrectAnswer correctAnswer = new CorrectAnswer();
                    correctAnswer.setQuestion(question);
                    correctAnswer.setCorrectAnswerText(questionDTO.getCorrectAnswer());
                    correctAnswer.setExplanation(questionDTO.getExplanation());
                    correctAnswer.setAlternativeAnswers(questionDTO.getAlternativeAnswers());

                    correctAnswerService.saveCorrectAnswer(correctAnswer);
                    System.out.println("✅ Saved correct answer: " + questionDTO.getCorrectAnswer());
                }

            } catch (Exception e) {
                System.err.println("❌ Error saving question: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Lỗi khi lưu câu hỏi: " + e.getMessage(), e);
            }
        }
    }

    // ✅ HELPER METHOD: Process Listening audio (keep existing implementation)
    private Map<Integer, ListeningAudio> processListeningAudio(Test test, List<ListeningAudioCreateDTO> audioDTOs) {
        Map<Integer, ListeningAudio> createdAudios = new HashMap<>();

        if (audioDTOs != null && !audioDTOs.isEmpty()) {
            System.out.println("=== PROCESSING LISTENING AUDIO ===");
            System.out.println("Số lượng audio: " + audioDTOs.size());

            int audioIndex = 1;
            for (ListeningAudioCreateDTO audioDTO : audioDTOs) {
                // ... (keep existing audio processing logic from original code)
                // This is the same complex audio processing logic from the original createTest method

                ListeningAudio audio = new ListeningAudio();
                audio.setTest(test);
                audio.setTitle(audioDTO.getTitle());
                audio.setFileType(AudioFileType.valueOf(audioDTO.getFileType()));
                audio.setTranscript(audioDTO.getTranscript() != null ? audioDTO.getTranscript() : "");
                audio.setSection(ListeningSection.valueOf(audioDTO.getSection()));
                audio.setOrderInTest(audioDTO.getOrderInTest() != null ? audioDTO.getOrderInTest() : audioIndex);

                if (audioDTO.getDurationSeconds() != null) {
                    audio.setDurationSeconds(audioDTO.getDurationSeconds());
                }

                // Handle Base64 vs File Path (same logic as original)
                boolean hasBase64 = audioDTO.getAudioBase64() != null && !audioDTO.getAudioBase64().trim().isEmpty();
                boolean hasFilePath = audioDTO.getFilePath() != null && !audioDTO.getFilePath().trim().isEmpty();

                if (hasBase64) {
                    audio.setAudioBase64(audioDTO.getAudioBase64());
                    audio.setOriginalFileName(audioDTO.getOriginalFileName());
                    audio.setFileSize(audioDTO.getFileSize());
                    audio.setMimeType(audioDTO.getMimeType());
                } else if (hasFilePath) {
                    audio.setAudioBase64(null);
                    audio.setOriginalFileName(audioDTO.getOriginalFileName());
                    audio.setFileSize(audioDTO.getFileSize());
                    audio.setMimeType(audioDTO.getMimeType());
                } else {
                    throw new RuntimeException("Audio " + audioIndex + " không có dữ liệu Base64 hoặc file path");
                }

                try {
                    audio = listeningAudioService.saveAudio(audio);
                    createdAudios.put(audioIndex, audio);
                    audioIndex++;
                } catch (Exception e) {
                    System.err.println("❌ Lỗi khi lưu audio " + audioIndex + ": " + e.getMessage());
                    throw e;
                }
            }
        }

        return createdAudios;
    }

    // ✅ HELPER METHOD: Process Listening questions
    private void processListeningQuestions(Test test, List<QuestionCreateDTO> questionDTOs, Map<Integer, ListeningAudio> createdAudios) {
        if (questionDTOs == null || questionDTOs.isEmpty()) {
            System.out.println("⚠️ No questions provided in request");
            return;
        }

        System.out.println("=== PROCESSING LISTENING QUESTIONS ===");

        for (QuestionCreateDTO questionDTO : questionDTOs) {
            Question question = new Question();
            question.setTest(test);
            question.setQuestionText(questionDTO.getQuestionText());
            QuestionType mappedType = mapQuestionType(questionDTO.getQuestionType());
            question.setQuestionType(mappedType);
            question.setOptions(questionDTO.getOptions());
            question.setSection(questionDTO.getSection());
            question.setOrderInTest(questionDTO.getOrderInTest() != null ? questionDTO.getOrderInTest() : 0);
            question.setQuestionSetInstructions(questionDTO.getQuestionSetInstructions());
            question.setContext(questionDTO.getContext());

            // ✅ LINK WITH AUDIO
            if (questionDTO.getAudioId() != null) {
                int audioIndex = questionDTO.getAudioId();
                ListeningAudio linkedAudio = createdAudios.get(audioIndex);

                if (linkedAudio != null) {
                    question.setAudio(linkedAudio);
                    System.out.println("✅ Linked question with audio: UI index " + audioIndex +
                            " -> DB ID " + linkedAudio.getId());
                } else {
                    System.out.println("❌ Cannot find audio for UI index: " + audioIndex);
                }
            }

            try {
                question = questionService.saveQuestion(question);
                System.out.println("✅ Saved question: " + question.getId());

                if (questionDTO.getCorrectAnswer() != null && !questionDTO.getCorrectAnswer().trim().isEmpty()) {
                    CorrectAnswer correctAnswer = new CorrectAnswer();
                    correctAnswer.setQuestion(question);
                    correctAnswer.setCorrectAnswerText(questionDTO.getCorrectAnswer());
                    correctAnswer.setExplanation(questionDTO.getExplanation());
                    correctAnswer.setAlternativeAnswers(questionDTO.getAlternativeAnswers());

                    correctAnswerService.saveCorrectAnswer(correctAnswer);
                    System.out.println("✅ Saved correct answer: " + questionDTO.getCorrectAnswer());
                }

            } catch (Exception e) {
                System.err.println("❌ Error saving question: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Lỗi khi lưu câu hỏi: " + e.getMessage(), e);
            }
        }
    }

    private QuestionType mapQuestionType(String frontendType) {
        if (frontendType == null) {
            return QuestionType.MCQ; // Default
        }

        System.out.println("🔍 Mapping frontend type: '" + frontendType + "'");

        try {
            // ✅ SIMPLE: Thử parse trực tiếp trước
            QuestionType directMatch = QuestionType.valueOf(frontendType.toUpperCase());
            System.out.println("✅ Direct match found: " + directMatch);
            return directMatch;
        } catch (IllegalArgumentException e) {
            // Nếu không match trực tiếp, thử mapping
            System.out.println("⚠️ No direct match, trying manual mapping...");
        }

        // Manual mapping cho các cases đặc biệt
        switch (frontendType.toUpperCase()) {
            // Listening aliases
            case "LISTENING_MCQ":
                return QuestionType.MCQ;
            case "LISTENING_FILL_IN_THE_BLANK":
                return QuestionType.FILL_IN_THE_BLANK;
            case "LISTENING_SHORT_ANSWER":
                return QuestionType.SHORT_ANSWER;
            case "LISTENING_MATCHING":
                return QuestionType.MATCHING;

            // Writing aliases
            case "ESSAY":
                return QuestionType.WRITING_TASK2; // Default essay is Task 2

            // Speaking aliases
            case "SPEAKING_TASK":
                return QuestionType.SPEAKING_PART1; // Default to Part 1

            default:
                System.err.println("❌ Unknown question type: '" + frontendType + "', defaulting to MCQ");
                System.err.println("Available enum values: " + Arrays.toString(QuestionType.values()));
                return QuestionType.MCQ;
        }
    }

    public static class QuestionTypeHelper {

        public static boolean isWritingType(QuestionType type) {
            return type == QuestionType.ESSAY ||
                    type == QuestionType.WRITING_TASK1_ACADEMIC ||
                    type == QuestionType.WRITING_TASK1_GENERAL ||
                    type == QuestionType.WRITING_TASK2;
        }

        public static boolean isSpeakingType(QuestionType type) {
            return type == QuestionType.SPEAKING_TASK ||
                    type == QuestionType.SPEAKING_PART1 ||
                    type == QuestionType.SPEAKING_PART2 ||
                    type == QuestionType.SPEAKING_PART3;
        }

        public static boolean isListeningSpecialType(QuestionType type) {
            return type == QuestionType.NOTE_COMPLETION ||
                    type == QuestionType.FORM_FILLING ||
                    type == QuestionType.TABLE_COMPLETION ||
                    type == QuestionType.PLAN_MAP_COMPLETION ||
                    type == QuestionType.SENTENCE_COMPLETION ||
                    type == QuestionType.SUMMARY_COMPLETION ||
                    type == QuestionType.DIAGRAM_LABELLING ||
                    type == QuestionType.FLEXIBLE_CONTEXT;
        }

        public static boolean requiresContext(QuestionType type) {
            return isListeningSpecialType(type);
        }

        // Get time limits cho Writing/Speaking
        public static int getTimeLimit(QuestionType type) {
            switch (type) {
                case WRITING_TASK1_ACADEMIC:
                case WRITING_TASK1_GENERAL:
                    return 20; // minutes
                case WRITING_TASK2:
                    return 40;
                case SPEAKING_PART1:
                case SPEAKING_PART3:
                    return 5;
                case SPEAKING_PART2:
                    return 2; // speaking time, + 1 min preparation
                default:
                    return 0;
            }
        }

        // Get word limits cho Writing
        public static int getWordLimit(QuestionType type) {
            switch (type) {
                case WRITING_TASK1_ACADEMIC:
                case WRITING_TASK1_GENERAL:
                    return 150;
                case WRITING_TASK2:
                    return 250;
                default:
                    return 0;
            }
        }
    }

    @PostMapping("/tests/{testId}/questions/batch")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> saveQuestionsWithContext(
            @PathVariable Integer testId,
            @RequestBody List<QuestionCreateDTO> questionDTOs,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        try {
            System.out.println("=== BATCH SAVE QUESTIONS WITH ROLE CHECK ===");
            System.out.println("Test ID: " + testId);
            System.out.println("Questions count: " + questionDTOs.size());
            System.out.println("Requested by: " + userDetails.getUsername());

            // ✅ CHECK TEST OWNERSHIP
            Test test = testService.getTestById(testId);
            if (test == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Test not found with ID: " + testId);
            }

            User currentUser = userRepository.findById(userDetails.getId()).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not found");
            }

            boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
            boolean isCreator = test.getCreator() != null &&
                    test.getCreator().getId().equals(userDetails.getId());

            if (!isAdmin && !isCreator) {
                System.out.println("❌ Access denied: User " + currentUser.getEmail() +
                        " tried to modify test " + testId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only modify tests that you created (unless you are an Admin)");
            }

            System.out.println("✅ Permission granted for test modification");

            // Validate and log context data
            for (QuestionCreateDTO dto : questionDTOs) {
                System.out.println("Question " + dto.getQuestionId() + ":");
                System.out.println("  - Type: " + dto.getQuestionType());
                System.out.println("  - Instructions: " + (dto.getQuestionSetInstructions() != null ? "Yes" : "No"));
                System.out.println("  - Context: " + (dto.getContext() != null && !dto.getContext().trim().isEmpty() ?
                        "Yes (" + dto.getContext().length() + " chars)" : "No"));
            }

            questionService.saveQuestionsWithContext(questionDTOs, testId);

            return ResponseEntity.ok().body(Map.of(
                    "success", true,
                    "message", "Questions with context saved successfully",
                    "savedCount", questionDTOs.size()
            ));

        } catch (Exception e) {
            System.err.println("Error in batch save questions: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Error saving questions: " + e.getMessage()
            ));
        }
    }

    private boolean isValidBase64(String base64String) {
        if (base64String == null || base64String.trim().isEmpty()) {
            return false;
        }

        try {
            // Try to decode to validate
            java.util.Base64.getDecoder().decode(base64String);
            return true;
        } catch (Exception e) {
            System.err.println("Invalid base64: " + e.getMessage());
            return false;
        }
    }

    /**
     * Check if question is a writing type that needs word count
     */
    private boolean isWritingQuestion(QuestionType questionType) {
        return questionType == QuestionType.ESSAY ||
                questionType == QuestionType.WRITING_TASK1_ACADEMIC ||
                questionType == QuestionType.WRITING_TASK1_GENERAL ||
                questionType == QuestionType.WRITING_TASK2;
    }

    /**
     * Count words in text
     */
    private int countWords(String text) {
        if (text == null || text.trim().isEmpty()) {
            return 0;
        }
        return text.trim().split("\\s+").length;
    }

    /**
     * Enhanced audio data validation
     */
    private void validateAudioData(String audioBase64, Integer questionId) {
        if (audioBase64 == null || audioBase64.trim().isEmpty()) {
            throw new RuntimeException("Audio data is empty for question " + questionId);
        }

        // Check minimum size (should be at least a few KB for valid audio)
        if (audioBase64.length() < 1000) {
            throw new RuntimeException("Audio data too small for question " + questionId);
        }

        // ✅ UPDATED: Check maximum size for 100MB (Base64 is ~33% larger than original)
        // 100MB file ≈ 133MB in Base64 ≈ 133,000,000 characters
        long maxBase64Size = 133_000_000L; // ~100MB decoded
        if (audioBase64.length() > maxBase64Size) {
            throw new RuntimeException("Audio data too large for question " + questionId +
                    ". Maximum size: 100MB");
        }
    }

    @PostMapping("/validate-audio-response")
    public ResponseEntity<?> validateAudioData(@RequestBody StudentResponseDTO responseDTO) {
        try {
            System.out.println("=== VALIDATING AUDIO DATA (100MB LIMIT) ===");
            System.out.println("Question ID: " + responseDTO.getQuestionId());

            if (!responseDTO.isAudioResponse()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "valid", false,
                        "error", "No audio data provided"
                ));
            }

            // ✅ ENHANCED: Log audio data size
            String audioData = responseDTO.getAudioResponse();
            if (audioData != null) {
                System.out.println("Audio data length: " + audioData.length() + " characters");

                // Estimate original file size (Base64 is ~33% larger)
                long estimatedFileSize = (long) (audioData.length() * 0.75);
                System.out.println("Estimated file size: " + formatFileSize(estimatedFileSize));

                // Check if exceeds 100MB
                if (estimatedFileSize > 100 * 1024 * 1024) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "valid", false,
                            "error", "Audio file too large. Maximum size: 100MB",
                            "estimatedSize", formatFileSize(estimatedFileSize)
                    ));
                }
            }

            // Process audio to validate
            AudioProcessingService.AudioProcessingResult result =
                    audioProcessingService.processAudioResponse(responseDTO);

            Map<String, Object> validation = new HashMap<>();
            validation.put("valid", result.success);
            validation.put("maxFileSize", "100MB");

            if (result.success) {
                validation.put("duration", result.duration);
                validation.put("durationFormatted", formatTime(result.duration));
                validation.put("fileSize", result.actualFileSize);
                validation.put("fileSizeFormatted", formatFileSize(result.actualFileSize));
                validation.put("fileType", result.fileType);
                validation.put("mimeType", result.mimeType);
                validation.put("message", "Audio data is valid and ready for submission");

                // ✅ ADDITIONAL: Check if file size is within limits
                if (result.actualFileSize > 100 * 1024 * 1024) {
                    validation.put("valid", false);
                    validation.put("error", "File size exceeds 100MB limit");
                }
            } else {
                validation.put("error", result.error);
                validation.put("message", "Audio validation failed: " + result.error);
            }

            System.out.println("Audio validation result: " + result.success);
            return ResponseEntity.ok(validation);

        } catch (Exception e) {
            System.err.println("Error validating audio: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "valid", false,
                    "error", "Validation failed: " + e.getMessage(),
                    "maxFileSize", "100MB"
            ));
        }
    }

    @GetMapping("/attempts/{attemptId}/audio-stats")
    public ResponseEntity<?> getAudioStats(@PathVariable Integer attemptId) {
        try {
            System.out.println("=== GETTING AUDIO STATISTICS ===");
            System.out.println("Attempt ID: " + attemptId);

            TestAttempt attempt = testAttemptService.getTestAttemptById(attemptId);
            if (attempt == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Test attempt not found");
            }

            List<StudentResponse> responses = attempt.getResponses() != null ?
                    new ArrayList<>(attempt.getResponses()) : new ArrayList<>();

            Map<String, Object> stats = audioProcessingService.getAudioStatistics(responses);
            stats.put("attemptId", attemptId);
            stats.put("testType", attempt.getTest().getTestType().toString());

            System.out.println("Audio statistics generated for " + responses.size() + " responses");
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            System.err.println("Error getting audio stats: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting audio stats: " + e.getMessage());
        }
    }

// ✅ ADD HELPER METHODS for formatting:

    private String formatFileSize(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return String.format("%.1f KB", bytes / 1024.0);
        } else {
            return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        }
    }

    private String formatTime(int seconds) {
        int minutes = seconds / 60;
        int remainingSeconds = seconds % 60;
        return String.format("%d:%02d", minutes, remainingSeconds);
    }

    @GetMapping("/audio-limits")
    public ResponseEntity<?> getAudioLimits() {
        Map<String, Object> limits = new HashMap<>();
        limits.put("maxFileSize", 100 * 1024 * 1024); // 100MB in bytes
        limits.put("maxFileSizeFormatted", "100MB");
        limits.put("maxBase64Size", 133_000_000L); // ~100MB encoded
        limits.put("supportedFormats", Arrays.asList(
                "audio/mp3", "audio/wav", "audio/ogg",
                "audio/m4a", "audio/mpeg", "audio/webm"
        ));
        limits.put("recommendedDuration", "5 minutes");
        limits.put("maxDuration", "30 minutes");

        return ResponseEntity.ok(limits);
    }
}