package tungdao.com.project1.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tungdao.com.project1.dto.GradingRequest;
import tungdao.com.project1.entity.*;
import tungdao.com.project1.login_register.UserDetailsImpl;
import tungdao.com.project1.repository.*;
import tungdao.com.project1.service.TestAttemptService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/grading")
public class GradingController {

    private final TestRepository testRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final StudentResponseRepository studentResponseRepository;
    private final UserRepository userRepository;
    private final TestAttemptService testAttemptService;

    @Autowired
    private SpeakingWritingCriteriaScoreRepository criteriaScoreRepository;

    public GradingController(TestRepository testRepository,
                             TestAttemptRepository testAttemptRepository,
                             StudentResponseRepository studentResponseRepository,
                             UserRepository userRepository,
                             TestAttemptService testAttemptService) {
        this.testRepository = testRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.studentResponseRepository = studentResponseRepository;
        this.userRepository = userRepository;
        this.testAttemptService = testAttemptService;
    }

    /**
     * Get all submissions for a specific test (Teacher/Admin only)
     */
    // ✅ FIXED VERSION - Replace the getTestSubmissions method

    @GetMapping("/test/{testId}/submissions")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getTestSubmissions(@PathVariable Integer testId,
                                                @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("=== GETTING TEST SUBMISSIONS (FIXED) ===");
            System.out.println("Test ID: " + testId);

            // Permission check (same as before)
            Test test = testRepository.findById(testId).orElse(null);
            if (test == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Test not found");
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
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied");
            }

            // Get attempts
            List<TestAttempt> attempts = testAttemptRepository.findByTestIdOrderByStartTimeDesc(testId);
            System.out.println("Found " + attempts.size() + " attempts");

            List<Map<String, Object>> submissions = new ArrayList<>();

            for (TestAttempt attempt : attempts) {
                try {
                    Map<String, Object> submission = new HashMap<>();
                    submission.put("id", attempt.getId());
                    submission.put("testId", testId);
                    submission.put("testName", test.getTestName());
                    submission.put("testType", test.getTestType().toString());

                    if (attempt.getStudent() != null) {
                        submission.put("studentId", attempt.getStudent().getId());
                        submission.put("studentName", attempt.getStudent().getFullName());
                        submission.put("studentEmail", attempt.getStudent().getEmail());
                    }

                    submission.put("submittedAt", attempt.getEndTime());
                    submission.put("isCompleted", attempt.getIsCompleted());

                    // ✅ FIX 1: Use appropriate score field
                    boolean requiresCriteriaGrading = isManualGradingTestType(test.getTestType());
                    submission.put("requiresManualGrading", requiresCriteriaGrading);

                    // For Speaking/Writing: use overallScore, for others: use totalScore
                    BigDecimal displayScore;
                    if (requiresCriteriaGrading) {
                        displayScore = attempt.getOverallScore(); // Speaking/Writing score
                    } else {
                        displayScore = attempt.getTotalScore(); // Auto-graded score
                    }

                    submission.put("totalScore", displayScore);
                    submission.put("overallScore", attempt.getOverallScore()); // Also include this
                    submission.put("gradingStatus", attempt.getGradingStatus());
                    submission.put("gradedAt", attempt.getGradedAt());

                    // ✅ FIX 2: Consistent status logic
                    String status;
                    if (requiresCriteriaGrading) {
                        // For Speaking/Writing: check if actually graded with score
                        boolean hasValidGrading = attempt.getGradingStatus() == GradingStatus.COMPLETED
                                && attempt.getOverallScore() != null
                                && attempt.getOverallScore().compareTo(BigDecimal.ZERO) > 0;

                        status = hasValidGrading ? "completed" : "pending_grading";

                        System.out.println("Attempt " + attempt.getId() + " - Criteria grading check:");
                        System.out.println("  - GradingStatus: " + attempt.getGradingStatus());
                        System.out.println("  - OverallScore: " + attempt.getOverallScore());
                        System.out.println("  - Status: " + status);
                    } else {
                        // For auto-graded tests: completed if has total score
                        status = (attempt.getTotalScore() != null && attempt.getIsCompleted())
                                ? "completed" : "pending";
                    }

                    submission.put("status", status);

                    submissions.add(submission);

                } catch (Exception e) {
                    System.err.println("⚠️ Error processing attempt " + attempt.getId() + ": " + e.getMessage());
                }
            }

            System.out.println("✅ Processed " + submissions.size() + " submissions (FIXED)");
            return ResponseEntity.ok(submissions);

        } catch (Exception e) {
            System.err.println("❌ Error getting test submissions: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    /**
     * Get detailed attempt for grading
     */
    @GetMapping("/attempt/{attemptId}/details")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> getAttemptForGrading(@PathVariable Integer attemptId,
                                                  @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("=== GETTING ATTEMPT FOR GRADING ===");
            System.out.println("Attempt ID: " + attemptId);

            TestAttempt attempt = testAttemptRepository.findById(attemptId).orElse(null);
            if (attempt == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Test attempt not found");
            }

            // Check permission
            User currentUser = userRepository.findById(userDetails.getId()).orElse(null);
            boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
            boolean isCreator = attempt.getTest().getCreator() != null &&
                    attempt.getTest().getCreator().getId().equals(userDetails.getId());

            if (!isAdmin && !isCreator) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied");
            }

            // Get detailed response using existing service
            return ResponseEntity.ok(testAttemptService.getTestAttemptById(attemptId));

        } catch (Exception e) {
            System.err.println("❌ Error getting attempt details: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting attempt details: " + e.getMessage());
        }
    }

    /**
     * Get grading item for criteria-based grading
     */
    @GetMapping("/item/{attemptId}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getGradingItem(@PathVariable Integer attemptId,
                                            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("=== GETTING GRADING ITEM ===");
            System.out.println("Attempt ID: " + attemptId);

            TestAttempt attempt = testAttemptRepository.findById(attemptId).orElse(null);
            if (attempt == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Test attempt not found");
            }

            // Permission check
            User currentUser = userRepository.findById(userDetails.getId()).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not found");
            }

            boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
            boolean isCreator = attempt.getTest().getCreator() != null &&
                    attempt.getTest().getCreator().getId().equals(userDetails.getId());

            if (!isAdmin && !isCreator) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied");
            }

            // Create response
            Map<String, Object> gradingItem = new HashMap<>();
            gradingItem.put("attemptId", attempt.getId());
            gradingItem.put("testName", attempt.getTest().getTestName());
            gradingItem.put("testType", attempt.getTest().getTestType().toString());

            if (attempt.getStudent() != null) {
                gradingItem.put("studentName", attempt.getStudent().getFullName());
                gradingItem.put("studentEmail", attempt.getStudent().getEmail());
            }

            gradingItem.put("submittedAt", attempt.getEndTime());
            gradingItem.put("currentScore", attempt.getTotalScore());

            // Get responses
            List<StudentResponse> responses = studentResponseRepository.findByAttemptIdOrderByQuestionOrder(attempt.getId());
            List<Map<String, Object>> responseData = new ArrayList<>();

            for (StudentResponse response : responses) {
                try {
                    Map<String, Object> respMap = new HashMap<>();
                    respMap.put("id", response.getId());
                    respMap.put("questionId", response.getQuestion().getId());
                    respMap.put("questionText", response.getQuestion().getQuestionText());
                    respMap.put("responseText", response.getResponseText());
                    respMap.put("audioBase64", response.getAudioBase64());
                    respMap.put("currentScore", response.getManualScore());
                    respMap.put("isCorrect", response.getIsCorrect());

                    responseData.add(respMap);
                } catch (Exception e) {
                    System.err.println("⚠️ Error processing response: " + e.getMessage());
                }
            }

            gradingItem.put("responses", responseData);

            // Get existing criteria scores if any
            Map<String, Object> existingCriteria = getExistingCriteriaScores(attemptId);
            if (existingCriteria != null) {
                gradingItem.put("existingCriteria", existingCriteria);
            }

            System.out.println("✅ Successfully retrieved grading item");
            return ResponseEntity.ok(gradingItem);

        } catch (Exception e) {
            System.err.println("❌ Error getting grading item: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    /**
     * Save criteria-based grading for speaking/writing tests
     */
    @PostMapping("/criteria-grade")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> saveCriteriaGrading(@RequestBody GradingRequest request,
                                                 @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("=== CRITERIA GRADING REQUEST ===");
            System.out.println("User: " + userDetails.getUsername());
            System.out.println("Attempt ID: " + request.getAttemptId());
            System.out.println("Test Type: " + request.getTestType());
            System.out.println("Overall Score: " + request.getOverallScore());

            // Validate request
            if (request.getAttemptId() == null) {
                return ResponseEntity.badRequest().body("Attempt ID is required");
            }

            if (request.getOverallScore() == null) {
                return ResponseEntity.badRequest().body("Overall score is required");
            }

            if (request.getCriteriaScores() == null) {
                return ResponseEntity.badRequest().body("Criteria scores are required");
            }

            // Validate score range
            if (request.getOverallScore().compareTo(BigDecimal.ZERO) < 0 ||
                    request.getOverallScore().compareTo(BigDecimal.valueOf(9)) > 0) {
                return ResponseEntity.badRequest().body("Score must be between 0 and 9");
            }

            // Get test attempt
            TestAttempt attempt = testAttemptRepository.findById(request.getAttemptId())
                    .orElseThrow(() -> new RuntimeException("Test attempt not found: " + request.getAttemptId()));

            // Check permission
            User currentUser = userRepository.findById(userDetails.getId()).orElse(null);
            boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
            boolean isCreator = attempt.getTest().getCreator() != null &&
                    attempt.getTest().getCreator().getId().equals(userDetails.getId());

            if (!isAdmin && !isCreator) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied");
            }

            // Get all responses for this attempt
            List<StudentResponse> responses = studentResponseRepository.findByAttemptId(request.getAttemptId());

            if (responses.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("No responses found for attempt: " + request.getAttemptId());
            }

            System.out.println("Found " + responses.size() + " responses to grade");

            int savedCount = 0;

            // Save criteria scores for each response
            for (StudentResponse response : responses) {
                try {
                    // Check if criteria score already exists
                    Optional<SpeakingWritingCriteriaScore> existingScore =
                            criteriaScoreRepository.findByResponse(response);

                    SpeakingWritingCriteriaScore criteriaScore;
                    if (existingScore.isPresent()) {
                        criteriaScore = existingScore.get();
                        System.out.println("Updating existing criteria score for response: " + response.getId());
                    } else {
                        criteriaScore = new SpeakingWritingCriteriaScore();
                        criteriaScore.setResponse(response);
                        System.out.println("Creating new criteria score for response: " + response.getId());
                    }

                    // Map criteria scores based on test type
                    GradingRequest.CriteriaScores criteria = request.getCriteriaScores();

                    if ("SPEAKING".equalsIgnoreCase(request.getTestType())) {
                        // For speaking: map to speaking fields
                        criteriaScore.setFluencyPronunciation(criteria.getFluency());
                        criteriaScore.setLexicalResource(criteria.getLexical());
                        criteriaScore.setGrammaticalAccuracy(criteria.getGrammar());

                        // If pronunciation is separate, average with fluency
                        if (criteria.getPronunciation() != null) {
                            criteriaScore.setCoherenceCohesion(criteria.getPronunciation());
                        }else {
                            // Nếu không có pronunciation riêng, có thể lưu một tiêu chí khác
                            // Ví dụ: Task Achievement cho Speaking (tương đương việc hoàn thành nhiệm vụ nói)
                            criteriaScore.setCoherenceCohesion(criteria.getTask_achievement());
                        }
                    } else if ("WRITING".equalsIgnoreCase(request.getTestType())) {
                        // For writing: map to writing fields
                        criteriaScore.setTaskAchievement(criteria.getTask_achievement());
                        criteriaScore.setCoherenceCohesion(criteria.getCoherence());
                        criteriaScore.setLexicalResource(criteria.getLexical());
                        criteriaScore.setGrammaticalAccuracy(criteria.getGrammar());
                    }

                    criteriaScore.setMarkerComments(request.getFeedback());
                    criteriaScore.setGradedAt(LocalDateTime.now());

                    // Save criteria score
                    criteriaScoreRepository.save(criteriaScore);

                    // Update response with overall score
                    response.setManualScore(request.getOverallScore());
                    response.setFeedback(request.getFeedback());
                    response.setGrader(currentUser);
                    response.setFeedbackGivenAt(LocalDateTime.now());

                    // Set isCorrect based on score
                    if (request.getOverallScore() != null) {
                        response.setIsCorrect(request.getOverallScore().compareTo(BigDecimal.valueOf(5.0)) >= 0);
                    }

                    studentResponseRepository.save(response);

                    savedCount++;
                    System.out.println("✅ Saved criteria score for response: " + response.getId());

                } catch (Exception e) {
                    System.err.println("❌ Error saving criteria for response " + response.getId() + ": " + e.getMessage());
                    // Continue with other responses
                }
            }

            // Update test attempt overall score
            attempt.setGradingStatus(GradingStatus.COMPLETED);
            attempt.setGrader(currentUser);
            attempt.setGradedAt(LocalDateTime.now());
            attempt.setOverallScore(request.getOverallScore());
            attempt.setOverallFeedback(request.getFeedback());

// Set individual skill scores based on test type
            if ("SPEAKING".equalsIgnoreCase(request.getTestType())) {
                attempt.setSpeakingScore(request.getOverallScore());
            } else if ("WRITING".equalsIgnoreCase(request.getTestType())) {
                attempt.setWritingScore(request.getOverallScore());
            }
            testAttemptRepository.save(attempt);

            System.out.println("✅ Criteria grading completed. Saved: " + savedCount + " responses");

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Criteria grading saved successfully");
            result.put("attemptId", request.getAttemptId());
            result.put("overallScore", request.getOverallScore());
            result.put("savedResponses", savedCount);
            result.put("totalResponses", responses.size());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("❌ Error saving criteria grading: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all tests requiring grading (Teacher/Admin dashboard)
     */
    @GetMapping("/pending-tests")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getTestsWithPendingGrading(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("=== GETTING PENDING GRADING TESTS ===");
            System.out.println("User: " + userDetails.getUsername());

            User currentUser = userRepository.findById(userDetails.getId()).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("User not found");
            }

            List<Test> userTests;

            // Get user's tests
            if (currentUser.getRole() == UserRole.ADMIN) {
                userTests = testRepository.findAll();
            } else {
                userTests = testRepository.findByCreator(currentUser);
            }

            System.out.println("Found " + userTests.size() + " tests to check");

            // Count pending grading
            List<Map<String, Object>> testsWithPending = new ArrayList<>();

            for (Test test : userTests) {
                try {
                    long pendingCount = getPendingGradingCountSafe(test.getId());

                    if (pendingCount > 0) {
                        Map<String, Object> testInfo = new HashMap<>();
                        testInfo.put("id", test.getId());
                        testInfo.put("testName", test.getTestName());
                        testInfo.put("testType", test.getTestType().toString());
                        testInfo.put("pendingCount", pendingCount);
                        testInfo.put("createdAt", test.getCreatedAt());

                        testsWithPending.add(testInfo);
                        System.out.println("Test " + test.getId() + " has " + pendingCount + " pending submissions");
                    }

                } catch (Exception e) {
                    System.err.println("⚠️ Error checking test " + test.getId() + ": " + e.getMessage());
                    // Continue with other tests
                }
            }

            System.out.println("✅ Found " + testsWithPending.size() + " tests with pending grading");
            return ResponseEntity.ok(testsWithPending);

        } catch (Exception e) {
            System.err.println("❌ Error getting pending grading: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting pending grading: " + e.getMessage());
        }
    }

    // ✅ HELPER METHODS

    private boolean isManualGradingTestType(TestType testType) {
        return testType == TestType.WRITING || testType == TestType.SPEAKING;
    }

    private long getPendingGradingCountSafe(Integer testId) {
        try {
            // Count attempts that might need grading
            List<TestAttempt> attempts = testAttemptRepository.findByTestIdOrderByStartTimeDesc(testId);

            // For Writing/Speaking tests, count as pending if no criteria grading exists
            Test test = testRepository.findById(testId).orElse(null);
            if (test != null && isManualGradingTestType(test.getTestType())) {
                return attempts.stream()
                        .filter(attempt -> !checkHasCriteriaGrading(attempt.getId()))
                        .count();
            }

            return 0; // No manual grading needed for other types

        } catch (Exception e) {
            System.err.println("⚠️ Error counting pending grading: " + e.getMessage());
            return 0;
        }
    }

    private boolean checkHasCriteriaGrading(Integer attemptId) {
        try {
            // Check if any response in this attempt has criteria grading
            List<StudentResponse> responses = studentResponseRepository.findByAttemptId(attemptId);

            for (StudentResponse response : responses) {
                Optional<SpeakingWritingCriteriaScore> criteriaScore =
                        criteriaScoreRepository.findByResponse(response);
                if (criteriaScore.isPresent()) {
                    return true; // Found at least one criteria score
                }
            }

            return false; // No criteria scores found
        } catch (Exception e) {
            System.err.println("⚠️ Error checking criteria grading: " + e.getMessage());
            return false;
        }
    }

    private Map<String, Object> getExistingCriteriaScores(Integer attemptId) {
        try {
            List<StudentResponse> responses = studentResponseRepository.findByAttemptId(attemptId);

            if (!responses.isEmpty()) {
                // Get criteria score from first response (assuming all responses have same criteria)
                Optional<SpeakingWritingCriteriaScore> criteriaScore =
                        criteriaScoreRepository.findByResponse(responses.get(0));

                if (criteriaScore.isPresent()) {
                    SpeakingWritingCriteriaScore score = criteriaScore.get();
                    Map<String, Object> existing = new HashMap<>();
                    existing.put("taskAchievement", score.getTaskAchievement());
                    existing.put("coherenceCohesion", score.getCoherenceCohesion());
                    existing.put("lexicalResource", score.getLexicalResource());
                    existing.put("grammaticalAccuracy", score.getGrammaticalAccuracy());
                    existing.put("fluencyPronunciation", score.getFluencyPronunciation());
                    existing.put("markerComments", score.getMarkerComments());
                    existing.put("gradedAt", score.getGradedAt());
                    return existing;
                }
            }

            return null;
        } catch (Exception e) {
            System.err.println("⚠️ Error getting existing criteria scores: " + e.getMessage());
            return null;
        }
    }

    // Helper method to average two scores
    private BigDecimal averageScores(BigDecimal score1, BigDecimal score2) {
        if (score1 == null) return score2;
        if (score2 == null) return score1;

        return score1.add(score2)
                .divide(BigDecimal.valueOf(2), 1, RoundingMode.HALF_UP);
    }
}