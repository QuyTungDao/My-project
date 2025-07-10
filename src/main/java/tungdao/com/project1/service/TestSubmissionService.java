package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tungdao.com.project1.dto.TestAttemptRequest;
import tungdao.com.project1.entity.*;
import tungdao.com.project1.repository.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class TestSubmissionService {

    private final TestAttemptRepository testAttemptRepository;
    private final TestRepository testRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final StudentResponseRepository studentResponseRepository;
    private final CorrectAnswerService correctAnswerService;
    private final TestScoreMappingService testScoreMappingService;

    public TestSubmissionService(TestAttemptRepository testAttemptRepository,
                                 TestRepository testRepository,
                                 UserRepository userRepository,
                                 QuestionRepository questionRepository,
                                 StudentResponseRepository studentResponseRepository,
                                 CorrectAnswerService correctAnswerService,
                                 TestScoreMappingService testScoreMappingService) {
        this.testAttemptRepository = testAttemptRepository;
        this.testRepository = testRepository;
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
        this.studentResponseRepository = studentResponseRepository;
        this.correctAnswerService = correctAnswerService;
        this.testScoreMappingService = testScoreMappingService;
    }

    @Transactional
    public TestAttempt submitTest(Integer userId, TestAttemptRequest request) {
        try {
            System.out.println("=== ENHANCED AUDIO SUBMISSION SERVICE ===");
            System.out.println("User ID: " + userId);
            System.out.println("Test ID: " + request.getTestId());
            System.out.println("Total responses: " + request.getResponses().size());

            // Validate input
            if (request.getTestId() == null) {
                throw new IllegalArgumentException("Test ID cannot be null");
            }
            if (request.getResponses() == null || request.getResponses().isEmpty()) {
                throw new IllegalArgumentException("Responses cannot be empty");
            }

            // Get entities
            User student = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
            Test test = testRepository.findById(request.getTestId())
                    .orElseThrow(() -> new RuntimeException("Test not found with ID: " + request.getTestId()));

            System.out.println("✅ Found user: " + student.getEmail());
            System.out.println("✅ Found test: " + test.getTestName() + " (Type: " + test.getTestType() + ")");

            // Create TestAttempt
            TestAttempt attempt = new TestAttempt();
            attempt.setStudent(student);
            attempt.setTest(test);
            attempt.setStartTime(request.getStartTime() != null ? request.getStartTime() : LocalDateTime.now().minusMinutes(30));
            attempt.setEndTime(LocalDateTime.now());
            attempt.setIsCompleted(true);

            // Process responses with enhanced audio support
            List<StudentResponse> responses = processEnhancedResponses(request.getResponses(), attempt, test);

            // Save attempt first
            attempt = testAttemptRepository.save(attempt);
            System.out.println("✅ TestAttempt saved with ID: " + attempt.getId());

            // Save responses with attempt reference
            Set<StudentResponse> savedResponses = new HashSet<>();
            for (StudentResponse response : responses) {
                response.setAttempt(attempt);
                StudentResponse savedResponse = studentResponseRepository.save(response);
                savedResponses.add(savedResponse);

                System.out.println("✅ Saved response for Q" + response.getQuestion().getId() +
                        " (Type: " + response.getResponseType() + ")");
            }

            attempt.setResponses(savedResponses);

            // Calculate scores
            calculateTestScores(attempt, responses, test);

            // Save final attempt with scores
            attempt = testAttemptRepository.save(attempt);

            System.out.println("=== SUBMISSION COMPLETED ===");
            System.out.println("Total Score: " + attempt.getTotalScore());
            System.out.println("Responses saved: " + savedResponses.size());

            return attempt;

        } catch (Exception e) {
            System.err.println("❌ Error in submitTest: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to submit test: " + e.getMessage(), e);
        }
    }

    private List<StudentResponse> processEnhancedResponses(List<TestAttemptRequest.ResponseData> responsesData,
                                                           TestAttempt attempt, Test test) {
        List<StudentResponse> responses = new ArrayList<>();

        // Count response types for logging
        int audioResponses = 0;
        int textResponses = 0;

        for (TestAttemptRequest.ResponseData responseData : responsesData) {
            try {
                Question question = questionRepository.findById(responseData.getQuestionId())
                        .orElseThrow(() -> new RuntimeException("Question not found: " + responseData.getQuestionId()));

                StudentResponse response = new StudentResponse();
                response.setQuestion(question);
                response.setStudent(attempt.getStudent());
                response.setSubmittedAt(LocalDateTime.now());

                // ✅ ENHANCED: Handle both text and audio responses
                if (responseData.hasAudioResponse()) {
                    // Audio response (Speaking test)
                    response.setAudioBase64(responseData.getAudioResponse());
                    response.setAudioDurationSeconds(responseData.getAudioDuration());
                    response.setAudioFileType(responseData.getAudioFileType());
                    response.setAudioFileSize(responseData.getAudioFileSize());
                    response.setAudioMimeType(responseData.getAudioMimeType());
                    response.setResponseType(ResponseType.AUDIO);
                    response.setResponseText(null); // Clear text for audio responses

                    // Audio responses require manual grading
                    response.setIsCorrect(null); // Will be graded manually

                    audioResponses++;
                    System.out.println("📻 Audio response for Q" + question.getId() +
                            " - Duration: " + responseData.getAudioDuration() + "s, " +
                            "Size: " + formatFileSize(responseData.getAudioFileSize()));

                } else if (responseData.hasTextResponse()) {
                    // Text response (Reading/Listening)
                    response.setResponseText(responseData.getResponseText().trim());
                    response.setResponseType(ResponseType.TEXT);
                    response.setAudioBase64(null); // Clear audio for text responses

                    // Auto-grade text responses if possible
                    if (isObjectiveQuestion(question)) {
                        CorrectAnswer correctAnswer = correctAnswerService.getByQuestionId(question.getId());
                        if (correctAnswer != null) {
                            boolean isCorrect = checkAnswer(response.getResponseText(), correctAnswer);
                            response.setIsCorrect(isCorrect);
                            System.out.println("📝 Text response for Q" + question.getId() +
                                    " - Answer: '" + response.getResponseText() + "' -> " +
                                    (isCorrect ? "CORRECT" : "INCORRECT"));
                        } else {
                            response.setIsCorrect(false);
                            System.out.println("📝 Text response for Q" + question.getId() + " - No answer key");
                        }
                    } else {
                        // Subjective text questions (essays) need manual grading
                        response.setIsCorrect(null);
                        System.out.println("📝 Subjective text response for Q" + question.getId() + " - Manual grading required");
                    }

                    textResponses++;
                } else {
                    // Empty response - skip saving
                    System.out.println("⚠️ Empty response for Q" + question.getId() + " - skipping");
                    continue;
                }

                responses.add(response);

            } catch (Exception e) {
                System.err.println("❌ Error processing response for Q" + responseData.getQuestionId() + ": " + e.getMessage());
                // Continue processing other responses
            }
        }

        System.out.println("=== RESPONSE PROCESSING SUMMARY ===");
        System.out.println("Audio responses: " + audioResponses);
        System.out.println("Text responses: " + textResponses);
        System.out.println("Total processed: " + responses.size());

        return responses;
    }

    private boolean isObjectiveQuestion(Question question) {
        if (question.getQuestionType() == null) {
            return true; // Default to objective
        }

        QuestionType type = question.getQuestionType();
        return type != QuestionType.ESSAY &&
                type != QuestionType.WRITING_TASK1_ACADEMIC &&
                type != QuestionType.WRITING_TASK1_GENERAL &&
                type != QuestionType.WRITING_TASK2 &&
                type != QuestionType.SPEAKING_TASK &&
                type != QuestionType.SPEAKING_PART1 &&
                type != QuestionType.SPEAKING_PART2 &&
                type != QuestionType.SPEAKING_PART3;
    }

    private boolean checkAnswer(String userResponse, CorrectAnswer correctAnswer) {
        if (userResponse == null || userResponse.trim().isEmpty()) {
            return false;
        }

        String normalizedUser = userResponse.toLowerCase().trim();
        String normalizedCorrect = correctAnswer.getCorrectAnswerText().toLowerCase().trim();

        // Check main answer
        if (normalizedUser.equals(normalizedCorrect)) {
            return true;
        }

        // Check alternatives
        if (correctAnswer.getAlternativeAnswers() != null) {
            String[] alternatives = correctAnswer.getAlternativeAnswers().split(",");
            for (String alt : alternatives) {
                if (normalizedUser.equals(alt.trim().toLowerCase())) {
                    return true;
                }
            }
        }

        return false;
    }

    private void calculateTestScores(TestAttempt attempt, List<StudentResponse> responses, Test test) {
        System.out.println("=== CALCULATING SCORES WITH AUDIO SUPPORT ===");

        // Count responses by type and correctness
        long audioResponses = responses.stream().filter(r -> r.getAudioBase64() != null).count();
        long textCorrect = responses.stream().filter(r -> Boolean.TRUE.equals(r.getIsCorrect())).count();
        long manualGradingRequired = responses.stream().filter(r -> r.getIsCorrect() == null).count();

        System.out.println("Audio responses: " + audioResponses);
        System.out.println("Text correct: " + textCorrect);
        System.out.println("Manual grading required: " + manualGradingRequired);

        // Set scores based on test type
        if (test.getTestType() != null) {
            switch (test.getTestType()) {
                case SPEAKING:
                    // Speaking tests are manually graded
                    attempt.setSpeakingScore(null);
                    attempt.setTotalScore(null);
                    System.out.println("✅ Speaking test - scores will be set after manual grading");
                    break;

                case WRITING:
                    // Writing tests are manually graded
                    attempt.setWritingScore(null);
                    attempt.setTotalScore(null);
                    System.out.println("✅ Writing test - scores will be set after manual grading");
                    break;

                case LISTENING:
                case READING:
                    // Auto-grade objective questions
                    if (manualGradingRequired == 0) {
                        String testType = test.getTestType().toString();
                        BigDecimal score = testScoreMappingService.getIELTSScore(testType, (int) textCorrect);

                        if (test.getTestType() == TestType.LISTENING) {
                            attempt.setListeningScore(score);
                        } else {
                            attempt.setReadingScore(score);
                        }
                        attempt.setTotalScore(score);

                        System.out.println("✅ " + testType + " score: " + score);
                    } else {
                        attempt.setTotalScore(null); // Mixed test with manual grading
                        System.out.println("✅ Mixed test - total score pending manual grading");
                    }
                    break;

                default:
                    attempt.setTotalScore(null);
                    System.out.println("✅ Unknown test type - manual grading required");
            }
        }
    }

    private String formatFileSize(Long bytes) {
        if (bytes == null || bytes == 0) return "0 B";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }
}