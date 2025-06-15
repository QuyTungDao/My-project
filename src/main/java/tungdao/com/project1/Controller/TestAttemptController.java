package tungdao.com.project1.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tungdao.com.project1.dto.StudentResponseDTO;
import tungdao.com.project1.dto.TestAttemptDTO;
import tungdao.com.project1.dto.TestAttemptRequest;
import tungdao.com.project1.entity.*;
import tungdao.com.project1.mapper.TestAttemptMapper;
import tungdao.com.project1.repository.QuestionRepository;
import tungdao.com.project1.repository.StudentResponseRepository;
import tungdao.com.project1.service.CorrectAnswerService;
import tungdao.com.project1.service.TestAttemptService;
import tungdao.com.project1.service.TestSubmissionService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test-attempts")
public class TestAttemptController {

    private final TestAttemptService testAttemptService;
    private final TestSubmissionService testSubmissionService;
    private final CorrectAnswerService correctAnswerService;
    private final TestAttemptMapper testAttemptMapper;
    private final StudentResponseRepository studentResponseRepository;
    private final QuestionRepository questionRepository;

    public TestAttemptController(TestAttemptService testAttemptService,
                                 TestSubmissionService testSubmissionService,
                                 CorrectAnswerService correctAnswerService,
                                 TestAttemptMapper testAttemptMapper,
                                 StudentResponseRepository studentResponseRepository,
                                 QuestionRepository questionRepository) {
        this.testAttemptService = testAttemptService;
        this.testSubmissionService = testSubmissionService;
        this.correctAnswerService = correctAnswerService;
        this.testAttemptMapper = testAttemptMapper;
        this.studentResponseRepository = studentResponseRepository;
        this.questionRepository = questionRepository;
    }

    // ✅ ENDPOINT MỚI: Submit bài thi
    @PostMapping("/submit/{userId}")
    public ResponseEntity<?> submitTest(@PathVariable Integer userId,
                                        @RequestBody TestAttemptRequest request) {
        try {
            System.out.println("=== NHẬN YÊU CẦU NỘP BÀI ===");
            System.out.println("User ID: " + userId);
            System.out.println("Test ID: " + request.getTestId());
            System.out.println("Số câu trả lời: " + (request.getResponses() != null ? request.getResponses().size() : 0));

            // Validate request
            if (request.getTestId() == null) {
                return ResponseEntity.badRequest()
                        .body("Test ID không được để trống");
            }

            if (request.getResponses() == null || request.getResponses().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Danh sách câu trả lời không được để trống");
            }

            // Submit test và tính điểm
            TestAttempt attempt = testSubmissionService.submitTest(userId, request);

            // Convert to DTO
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

            System.out.println("=== NỘP BÀI THÀNH CÔNG ===");
            System.out.println("Attempt ID: " + attempt.getId());
            System.out.println("Điểm số: " + attempt.getTotalScore());

            return ResponseEntity.ok(attemptDTO);

        } catch (Exception e) {
            System.err.println("Lỗi khi nộp bài: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi nộp bài: " + e.getMessage());
        }
    }

    // ✅ ENHANCED getTestAttemptById in TestAttemptController.java
    @GetMapping("/{id}")
    public ResponseEntity<?> getTestAttemptById(@PathVariable Integer id) {
        try {
            System.out.println("=== GETTING COMPLETE TEST RESULT WITH AUDIO ===");
            System.out.println("Requested attempt ID: " + id);

            TestAttempt attempt = testAttemptService.getTestAttemptById(id);
            if (attempt == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Không tìm thấy kết quả làm bài với ID: " + id);
            }

            System.out.println("✅ Found TestAttempt: " + attempt.getId());
            System.out.println("✅ Test ID: " + attempt.getTest().getId());
            System.out.println("✅ Test Type: " + attempt.getTest().getTestType());

            // ✅ STEP 1: Get ALL questions from the test (this is what frontend needs)
            List<Question> allTestQuestions = questionRepository.findByTestIdOrderByOrderInTest(attempt.getTest().getId());
            System.out.println("✅ Total questions in test: " + allTestQuestions.size());

            // ✅ STEP 2: Get only ACTUAL responses from database (what student answered)
            List<StudentResponse> actualResponses = studentResponseRepository.findByAttemptId(id);
            System.out.println("✅ Actual responses from student: " + actualResponses.size());

            // ✅ STEP 3: Create response lookup map
            Map<Integer, StudentResponse> responseMap = new HashMap<>();
            for (StudentResponse response : actualResponses) {
                responseMap.put(response.getQuestion().getId(), response);
            }

            // ✅ STEP 4: Build enhanced DTO with test type
            TestAttemptDTO attemptDTO = new TestAttemptDTO();
            attemptDTO.setId(attempt.getId());

            if (attempt.getStudent() != null) {
                attemptDTO.setStudentId(attempt.getStudent().getId());
                attemptDTO.setStudentName(attempt.getStudent().getFullName());
            }

            if (attempt.getTest() != null) {
                attemptDTO.setTestId(attempt.getTest().getId());
                attemptDTO.setTestName(attempt.getTest().getTestName());

                // ✅ CRITICAL: Add test type to response
                if (attempt.getTest().getTestType() != null) {
                    attemptDTO.setTestType(attempt.getTest().getTestType().toString());
                    System.out.println("✅ Set test type: " + attempt.getTest().getTestType());
                }
            }

            attemptDTO.setStartTime(attempt.getStartTime());
            attemptDTO.setEndTime(attempt.getEndTime());
            attemptDTO.setIsCompleted(attempt.getIsCompleted());
            attemptDTO.setListeningScore(attempt.getListeningScore());
            attemptDTO.setReadingScore(attempt.getReadingScore());
            attemptDTO.setWritingScore(attempt.getWritingScore());
            attemptDTO.setSpeakingScore(attempt.getSpeakingScore());
            attemptDTO.setTotalScore(attempt.getTotalScore());

            // ✅ STEP 5: Create response DTOs for ALL questions with enhanced question type mapping
            List<StudentResponseDTO> completeResponseDTOs = new ArrayList<>();

            for (Question question : allTestQuestions) {
                StudentResponse actualResponse = responseMap.get(question.getId());

                StudentResponseDTO responseDTO = new StudentResponseDTO();

                // ✅ Always set question info (from questions table)
                responseDTO.setQuestionId(question.getId());
                responseDTO.setQuestionText(question.getQuestionText());

                // ✅ ENHANCED: Map question type based on test type
                String questionType = mapQuestionTypeForFrontend(question, attempt.getTest());
                responseDTO.setQuestionType(questionType);
                System.out.println("✅ Q" + question.getId() + " type mapped to: " + questionType);

                responseDTO.setOrderInTest(question.getOrderInTest()); // ← Consistent numbering

                // ✅ Always set passage/audio relationships
                if (question.getPassage() != null) {
                    responseDTO.setPassageId(question.getPassage().getId());
                }
                if (question.getAudio() != null) {
                    responseDTO.setAudioId(question.getAudio().getId());
                }

                if (actualResponse != null) {
                    // ✅ ANSWERED: Student provided an answer
                    responseDTO.setId(actualResponse.getId());
                    responseDTO.setSubmittedAt(actualResponse.getSubmittedAt());

                    // ✅ HANDLE TEXT RESPONSES
                    if (actualResponse.getResponseText() != null && !actualResponse.getResponseText().trim().isEmpty()) {
                        responseDTO.setResponseText(actualResponse.getResponseText());
                        System.out.println("Q" + question.getId() + ": TEXT response provided");
                    }

                    // ✅ ENHANCED: HANDLE AUDIO RESPONSES
                    if (actualResponse.getAudioBase64() != null && !actualResponse.getAudioBase64().trim().isEmpty()) {
                        responseDTO.setAudioResponse(actualResponse.getAudioBase64());
                        responseDTO.setAudioDuration(actualResponse.getAudioDurationSeconds());
                        responseDTO.setAudioFileType(actualResponse.getAudioFileType());
                        responseDTO.setAudioFileSize(actualResponse.getAudioFileSize());

                        System.out.println("Q" + question.getId() + ": AUDIO response provided");
                        System.out.println("  - Duration: " + actualResponse.getAudioDurationSeconds() + "s");
                        System.out.println("  - File type: " + actualResponse.getAudioFileType());
                        System.out.println("  - Size: " + actualResponse.getAudioFileSize() + " bytes");
                        System.out.println("  - Audio data: " + actualResponse.getAudioBase64().length() + " chars");
                    }

                    // ✅ ENHANCED: Calculate correctness based on response type
                    if (isSpeakingQuestion(question.getQuestionType())) {
                        // ✅ SPEAKING QUESTIONS: Manual grading required
                        responseDTO.setIsCorrect(actualResponse.getIsCorrect()); // null for pending
                        responseDTO.setCorrectAnswer("Requires manual grading");
                        System.out.println("Q" + question.getId() + ": SPEAKING - manual grading required");

                    } else if (isWritingQuestion(question.getQuestionType())) {
                        // ✅ WRITING QUESTIONS: Manual grading required
                        responseDTO.setIsCorrect(actualResponse.getIsCorrect()); // null for pending
                        responseDTO.setCorrectAnswer("Requires manual grading");
                        System.out.println("Q" + question.getId() + ": WRITING - manual grading required");

                    } else {
                        // ✅ OBJECTIVE QUESTIONS: Auto-graded
                        CorrectAnswer correctAnswer = correctAnswerService.getByQuestionId(question.getId());
                        if (correctAnswer != null) {
                            boolean isCorrect = checkAnswerOnTheFly(actualResponse.getResponseText(), correctAnswer);
                            responseDTO.setIsCorrect(isCorrect);
                            responseDTO.setCorrectAnswer(correctAnswer.getCorrectAnswerText());

                            System.out.println("Q" + question.getId() + ": OBJECTIVE ANSWERED '" +
                                    actualResponse.getResponseText() + "' -> " +
                                    (isCorrect ? "CORRECT" : "INCORRECT"));
                        } else {
                            responseDTO.setIsCorrect(false);
                            responseDTO.setCorrectAnswer("No answer key available");
                            System.out.println("Q" + question.getId() + ": No correct answer found");
                        }
                    }

                } else {
                    // ✅ SKIPPED: No response in database
                    responseDTO.setId(null);
                    responseDTO.setResponseText(null);
                    responseDTO.setAudioResponse(null);
                    responseDTO.setIsCorrect(false);
                    responseDTO.setSubmittedAt(null);

                    // ✅ STILL provide correct answer info for skipped questions
                    if (isSpeakingQuestion(question.getQuestionType())) {
                        responseDTO.setCorrectAnswer("Speaking task - not answered");
                    } else if (isWritingQuestion(question.getQuestionType())) {
                        responseDTO.setCorrectAnswer("Writing task - not answered");
                    } else {
                        CorrectAnswer correctAnswer = correctAnswerService.getByQuestionId(question.getId());
                        if (correctAnswer != null) {
                            responseDTO.setCorrectAnswer(correctAnswer.getCorrectAnswerText());
                            System.out.println("Q" + question.getId() + ": SKIPPED - but correct answer provided");
                        } else {
                            responseDTO.setCorrectAnswer("No answer key available");
                            System.out.println("Q" + question.getId() + ": SKIPPED - no correct answer found");
                        }
                    }
                }

                completeResponseDTOs.add(responseDTO);
            }

            // ✅ Sort by orderInTest to ensure correct order
            completeResponseDTOs.sort((a, b) -> {
                Integer orderA = a.getOrderInTest() != null ? a.getOrderInTest() : a.getQuestionId();
                Integer orderB = b.getOrderInTest() != null ? b.getOrderInTest() : b.getQuestionId();
                return orderA.compareTo(orderB);
            });

            attemptDTO.setResponses(completeResponseDTOs);

            // ✅ FINAL SUMMARY with test type
            System.out.println("=== COMPLETE RESULT SUMMARY ===");
            System.out.println("Test Type: " + attemptDTO.getTestType());
            System.out.println("Total questions in test: " + allTestQuestions.size());
            System.out.println("Actual responses from student: " + actualResponses.size());
            System.out.println("Complete DTOs returned: " + completeResponseDTOs.size());

            return ResponseEntity.ok(attemptDTO);

        } catch (Exception e) {
            System.err.println("❌ Error in getTestAttemptById: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi lấy kết quả làm bài: " + e.getMessage());
        }
    }

    // ✅ NEW: Enhanced question type mapping for frontend
    private String mapQuestionTypeForFrontend(Question question, Test test) {
        String baseType = question.getQuestionType() != null ?
                question.getQuestionType().toString() : "MCQ";

        // ✅ If test is LISTENING, prefix with LISTENING_
        if (test.getTestType() != null && "LISTENING".equals(test.getTestType().toString())) {
            // ✅ Map listening-specific types
            switch (baseType) {
                case "FILL_IN_THE_BLANK":
                    return "LISTENING_FILL_IN_THE_BLANK";
                case "MCQ":
                    return "LISTENING_MCQ";
                case "SHORT_ANSWER":
                    return "LISTENING_SHORT_ANSWER";
                case "MATCHING":
                    return "LISTENING_MATCHING";
                default:
                    return "NOTE_COMPLETION"; // Default for listening
            }
        }

        // ✅ If question has audio, it's listening
        if (question.getAudio() != null) {
            switch (baseType) {
                case "FILL_IN_THE_BLANK":
                    return "LISTENING_FILL_IN_THE_BLANK";
                case "MCQ":
                    return "LISTENING_MCQ";
                case "SHORT_ANSWER":
                    return "LISTENING_SHORT_ANSWER";
                default:
                    return "NOTE_COMPLETION";
            }
        }

        // ✅ Default to reading format
        return baseType;
    }

    // ✅ ADD: Helper method for on-the-fly answer checking
    private boolean checkAnswerOnTheFly(String userResponse, CorrectAnswer correctAnswer) {
        if (userResponse == null || userResponse.trim().isEmpty()) {
            return false;
        }

        String normalizedUserResponse = userResponse.trim().toLowerCase();
        String correctAnswerText = correctAnswer.getCorrectAnswerText().trim().toLowerCase();

        // Check main answer
        if (normalizedUserResponse.equals(correctAnswerText)) {
            return true;
        }

        // Check alternative answers
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

    private boolean isSpeakingQuestion(QuestionType questionType) {
        return questionType == QuestionType.SPEAKING_TASK ||
                questionType == QuestionType.SPEAKING_PART1 ||
                questionType == QuestionType.SPEAKING_PART2 ||
                questionType == QuestionType.SPEAKING_PART3;
    }

    /**
     * Check if question is a writing type
     */
    private boolean isWritingQuestion(QuestionType questionType) {
        return questionType == QuestionType.ESSAY ||
                questionType == QuestionType.WRITING_TASK1_ACADEMIC ||
                questionType == QuestionType.WRITING_TASK1_GENERAL ||
                questionType == QuestionType.WRITING_TASK2;
    }

    /**
     * Enhanced response type detection for display
     */
    private String determineResponseTypeForDisplay(StudentResponse response) {
        if (response == null) return "NO_RESPONSE";

        boolean hasText = response.getResponseText() != null && !response.getResponseText().trim().isEmpty();
        boolean hasAudio = response.getAudioBase64() != null && !response.getAudioBase64().trim().isEmpty();

        if (hasText && hasAudio) return "MIXED";
        if (hasAudio) return "AUDIO";
        if (hasText) return "TEXT";
        return "NO_RESPONSE";
    }


}