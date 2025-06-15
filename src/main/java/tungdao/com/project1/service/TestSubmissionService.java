package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tungdao.com.project1.dto.StudentResponseDTO;
import tungdao.com.project1.dto.TestAttemptRequest;
import tungdao.com.project1.entity.*;
import tungdao.com.project1.repository.QuestionRepository;
import tungdao.com.project1.repository.TestAttemptRepository;
import tungdao.com.project1.repository.TestRepository;
import tungdao.com.project1.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class TestSubmissionService {

    private final TestAttemptRepository testAttemptRepository;
    private final TestRepository testRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final CorrectAnswerService correctAnswerService;
    private final TestScoreMappingService testScoreMappingService;

    public TestSubmissionService(TestAttemptRepository testAttemptRepository,
                                 TestRepository testRepository,
                                 UserRepository userRepository,
                                 QuestionRepository questionRepository,
                                 CorrectAnswerService correctAnswerService,
                                 TestScoreMappingService testScoreMappingService) {
        this.testAttemptRepository = testAttemptRepository;
        this.testRepository = testRepository;
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
        this.correctAnswerService = correctAnswerService;
        this.testScoreMappingService = testScoreMappingService;
    }

    @Transactional
    public TestAttempt submitTest(Integer userId, TestAttemptRequest request) {
        System.out.println("=== BẮT ĐẦU CHẤM BÀI (ENHANCED) ===");
        System.out.println("User ID: " + userId);
        System.out.println("Test ID: " + request.getTestId());
        System.out.println("Số câu trả lời nhận được: " + request.getResponses().size());

        // 1. Lấy thông tin cần thiết
        User student = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        Test test = testRepository.findById(request.getTestId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài test"));

        // ✅ 2. Lấy TẤT CẢ câu hỏi của bài test để kiểm tra câu bỏ qua
        List<Question> allTestQuestions = questionRepository.findByTestIdOrderByOrderInTest(request.getTestId());
        System.out.println("Tổng số câu hỏi trong bài test: " + allTestQuestions.size());

        // ✅ 3. Tạo Map để dễ lookup responses
        Map<Integer, StudentResponseDTO> responseMap = new HashMap<>();
        for (StudentResponseDTO responseDTO : request.getResponses()) {
            responseMap.put(responseDTO.getQuestionId(), responseDTO);
        }

        // 4. Tạo TestAttempt
        TestAttempt attempt = new TestAttempt();
        attempt.setStudent(student);
        attempt.setTest(test);
        attempt.setStartTime(LocalDateTime.now().minusMinutes(30));
        attempt.setEndTime(LocalDateTime.now());
        attempt.setIsCompleted(true);

        // ✅ 5. Chấm từng câu hỏi với enhanced logging
        Map<String, Integer> scoresByType = new HashMap<>();
        int totalCorrect = 0;
        int totalIncorrect = 0;
        int totalSkipped = 0;
        int totalQuestions = allTestQuestions.size();
        Set<StudentResponse> responses = new HashSet<>();

        for (Question question : allTestQuestions) {
            StudentResponseDTO userResponse = responseMap.get(question.getId());

            boolean isCorrect = false;
            boolean isSkipped = false;
            String responseText = "";

            if (userResponse == null ||
                    userResponse.getResponseText() == null ||
                    userResponse.getResponseText().trim().isEmpty()) {
                // ✅ Câu bỏ qua
                isSkipped = true;
                totalSkipped++;
                responseText = null;
                System.out.println("Question " + question.getId() + ": SKIPPED");
            } else {
                // ✅ Câu có trả lời - cần chấm điểm
                responseText = userResponse.getResponseText().trim();

                CorrectAnswer correctAnswer = correctAnswerService.getByQuestionId(question.getId());

                if (correctAnswer != null) {
                    // ✅ ENHANCED: Better answer checking
                    isCorrect = checkAnswer(responseText, correctAnswer);

                    System.out.println("Question " + question.getId() + ":");
                    System.out.println("  User Answer: '" + responseText + "'");
                    System.out.println("  Correct Answer: '" + correctAnswer.getCorrectAnswerText() + "'");
                    System.out.println("  Result: " + (isCorrect ? "✅ CORRECT" : "❌ INCORRECT"));

                    if (isCorrect) {
                        totalCorrect++;

                        // ✅ CRITICAL: Determine question category properly
                        String questionType = determineQuestionCategory(question, test);
                        scoresByType.put(questionType, scoresByType.getOrDefault(questionType, 0) + 1);
                        System.out.println("  ✅ Incremented " + questionType + " to: " + scoresByType.get(questionType));
                    } else {
                        totalIncorrect++;
                    }
                } else {
                    System.out.println("Question " + question.getId() + ": No correct answer found");
                    totalIncorrect++;
                }
            }

            // ✅ Tạo StudentResponse cho TẤT CẢ câu hỏi (kể cả bỏ qua)
            StudentResponse response = new StudentResponse();
            response.setAttempt(attempt);
            response.setStudent(student);
            response.setQuestion(question);
            response.setResponseText(responseText);
            response.setIsCorrect(isCorrect);
            response.setSubmittedAt(LocalDateTime.now());

            responses.add(response);
        }

        attempt.setResponses(responses);

        System.out.println("=== PROCESSING SUMMARY ===");
        System.out.println("Total Questions: " + totalQuestions);
        System.out.println("Total Answered: " + (totalCorrect + totalIncorrect));
        System.out.println("Total Correct: " + totalCorrect);
        System.out.println("Total Incorrect: " + totalIncorrect);
        System.out.println("Total Skipped: " + totalSkipped);
        System.out.println("Scores by type: " + scoresByType);

        // ✅ 6. ENHANCED: Calculate scores with debugging
        System.out.println("=== CALCULATING IELTS SCORES (ENHANCED) ===");

        if (scoresByType.isEmpty()) {
            // ✅ FALLBACK: If no categorized scores, use test type
            String testType = determineTestType(test);
            System.out.println("No categorized scores, using fallback test type: " + testType);
            scoresByType.put(testType.toLowerCase(), totalCorrect);
        }

        calculateAndSetScores(attempt, test, scoresByType, totalCorrect);

        // 7. Lưu vào database
        TestAttempt savedAttempt = testAttemptRepository.save(attempt);

        // 8. Enhanced verification
        verifyAttemptData(savedAttempt, totalQuestions, totalCorrect, totalIncorrect, totalSkipped);

        System.out.println("✅ SUCCESS - Saved attempt ID: " + savedAttempt.getId() + " with score: " + savedAttempt.getTotalScore());
        return savedAttempt;
    }

    // ✅ ENHANCED: Verify with skipped count
    private void verifyAttemptData(TestAttempt savedAttempt, int totalQuestions, int totalCorrect, int totalIncorrect, int totalSkipped) {
        System.out.println("=== VERIFICATION ===");
        System.out.println("Final Total Score: " + savedAttempt.getTotalScore());
        System.out.println("Final Reading Score: " + savedAttempt.getReadingScore());
        System.out.println("Expected Total Questions: " + totalQuestions);
        System.out.println("Expected Correct: " + totalCorrect);
        System.out.println("Expected Incorrect: " + totalIncorrect);
        System.out.println("Expected Skipped: " + totalSkipped);
        System.out.println("Actual Responses Count: " + (savedAttempt.getResponses() != null ? savedAttempt.getResponses().size() : 0));

        if (savedAttempt.getResponses() != null) {
            int actualCorrect = 0;
            int actualIncorrect = 0;
            int actualSkipped = 0;

            for (StudentResponse response : savedAttempt.getResponses()) {
                if (response.getResponseText() == null || response.getResponseText().trim().isEmpty()) {
                    actualSkipped++;
                } else if (response.getIsCorrect()) {
                    actualCorrect++;
                } else {
                    actualIncorrect++;
                }
            }

            System.out.println("Actual Correct: " + actualCorrect);
            System.out.println("Actual Incorrect: " + actualIncorrect);
            System.out.println("Actual Skipped: " + actualSkipped);

            if (actualCorrect == totalCorrect && actualIncorrect == totalIncorrect && actualSkipped == totalSkipped) {
                System.out.println("✅ SUCCESS - All counts match!");
            } else {
                System.out.println("❌ MISMATCH - Counts don't match!");
            }
        }

        System.out.println("======================");
    }

    // ✅ Normalize answer for better comparison
    private String normalizeAnswer(String answer) {
        if (answer == null) return "";
        return answer.toLowerCase().trim().replaceAll("\\s+", " ");
    }

    private boolean checkAnswer(String userResponse, CorrectAnswer correctAnswer) {
        if (userResponse == null || userResponse.trim().isEmpty()) {
            return false;
        }

        String normalizedUserResponse = normalizeAnswer(userResponse);
        String correctAnswerText = normalizeAnswer(correctAnswer.getCorrectAnswerText());

        // Check main answer
        if (normalizedUserResponse.equals(correctAnswerText)) {
            return true;
        }

        // Check alternative answers
        if (correctAnswer.getAlternativeAnswers() != null) {
            String[] alternatives = correctAnswer.getAlternativeAnswers().split(",");
            for (String alt : alternatives) {
                if (normalizedUserResponse.equals(normalizeAnswer(alt))) {
                    return true;
                }
            }
        }

        return false;
    }

    // ✅ Determine question category for scoring
    private String determineQuestionCategory(Question question, Test test) {
        String testType = determineTestType(test);

        if ("LISTENING".equals(testType)) {
            return "listening";
        } else if ("READING".equals(testType)) {
            return "reading";
        }

        if (question.getAudio() != null) {
            return "listening";
        } else if (question.getPassage() != null) {
            return "reading";
        }

        if ("READING".equals(testType)) {
            return "reading";
        }

        return "general";
    }

    // ✅ Calculate and set scores
    private void calculateAndSetScores(TestAttempt attempt, Test test, Map<String, Integer> scoresByType, int totalCorrect) {
        System.out.println("=== 🔍 ENHANCED SCORE CALCULATION DEBUG ===");
        System.out.println("Input scoresByType: " + scoresByType);
        System.out.println("Total correct: " + totalCorrect);

        BigDecimal totalScore = BigDecimal.ZERO;
        int componentsCount = 0;

        for (Map.Entry<String, Integer> entry : scoresByType.entrySet()) {
            String type = entry.getKey();
            Integer correctCount = entry.getValue();

            System.out.println("--- Processing " + type + " ---");
            System.out.println("Correct count: " + correctCount);

            // ✅ CRITICAL: Call mapping service to convert correctCount to IELTS score
            BigDecimal ieltsScore = testScoreMappingService.getIELTSScore(type.toUpperCase(), correctCount);
            System.out.println("🎯 IELTS Score from mapping: " + ieltsScore);

            // ✅ VERIFICATION: Ensure we're using IELTS score, not correct count
            if (ieltsScore.compareTo(BigDecimal.ZERO) > 0) {
                totalScore = totalScore.add(ieltsScore);
                componentsCount++;

                switch (type.toLowerCase()) {
                    case "listening":
                        attempt.setListeningScore(ieltsScore);  // ✅ Use IELTS score
                        System.out.println("✅ Set listening score: " + ieltsScore);
                        break;
                    case "reading":
                        attempt.setReadingScore(ieltsScore);    // ✅ Use IELTS score
                        System.out.println("✅ Set reading score: " + ieltsScore);
                        break;
                    case "writing":
                        attempt.setWritingScore(ieltsScore);    // ✅ Use IELTS score
                        System.out.println("✅ Set writing score: " + ieltsScore);
                        break;
                    case "speaking":
                        attempt.setSpeakingScore(ieltsScore);   // ✅ Use IELTS score
                        System.out.println("✅ Set speaking score: " + ieltsScore);
                        break;
                }
            } else {
                System.err.println("❌ IELTS score is 0 for " + type + " with " + correctCount + " correct answers!");
            }
        }

        if (componentsCount > 0) {
            BigDecimal averageScore = totalScore.divide(BigDecimal.valueOf(componentsCount), 1, BigDecimal.ROUND_HALF_UP);
            attempt.setTotalScore(averageScore);  // ✅ Use IELTS average
            System.out.println("✅ Final total IELTS score: " + averageScore);
        } else {
            // ✅ FALLBACK: If no components, use test type fallback
            String testType = determineTestType(test);
            BigDecimal fallbackScore = testScoreMappingService.getIELTSScore(testType, totalCorrect);

            System.out.println("🔄 Using fallback for " + testType + " with " + totalCorrect + " correct");
            System.out.println("🔄 Fallback IELTS score: " + fallbackScore);

            if ("LISTENING".equals(testType)) {
                attempt.setListeningScore(fallbackScore);
            } else if ("READING".equals(testType)) {
                attempt.setReadingScore(fallbackScore);
            }

            attempt.setTotalScore(fallbackScore);
            System.out.println("✅ Fallback total IELTS score: " + fallbackScore);
        }

        // ✅ FINAL VERIFICATION
        System.out.println("=== 🎯 FINAL SCORE VERIFICATION ===");
        System.out.println("Total Score: " + attempt.getTotalScore());
        System.out.println("Reading Score: " + attempt.getReadingScore());
        System.out.println("Listening Score: " + attempt.getListeningScore());

        // ✅ SANITY CHECK: Scores should be between 0.0 and 9.0
        if (attempt.getTotalScore() != null && attempt.getTotalScore().compareTo(BigDecimal.valueOf(9.0)) > 0) {
            System.err.println("🚨 CRITICAL ERROR: Total score > 9.0! This is incorrect for IELTS!");
            System.err.println("🚨 Likely returning correct count instead of IELTS score!");

            // ✅ EMERGENCY FIX: Force recalculate
            String testType = determineTestType(test);
            BigDecimal correctScore = testScoreMappingService.getIELTSScore(testType, totalCorrect);
            attempt.setTotalScore(correctScore);

            if ("READING".equals(testType)) {
                attempt.setReadingScore(correctScore);
            } else if ("LISTENING".equals(testType)) {
                attempt.setListeningScore(correctScore);
            }

            System.out.println("🔧 EMERGENCY FIX: Set score to " + correctScore);
        }
    }

    private String determineTestType(Test test) {
        if (test.getTestType() != null) {
            return test.getTestType().toString().toUpperCase();
        }

        String testName = test.getTestName().toLowerCase();
        if (testName.contains("listening")) {
            return "LISTENING";
        } else if (testName.contains("reading")) {
            return "READING";
        } else if (testName.contains("writing")) {
            return "WRITING";
        } else if (testName.contains("speaking")) {
            return "SPEAKING";
        }

        return "READING";
    }
}