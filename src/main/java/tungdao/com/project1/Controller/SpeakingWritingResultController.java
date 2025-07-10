package tungdao.com.project1.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tungdao.com.project1.dto.SpeakingWritingResultDTO;
import tungdao.com.project1.entity.*;
import tungdao.com.project1.login_register.UserDetailsImpl;
import tungdao.com.project1.repository.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SpeakingWritingResultController {

    @Autowired
    private TestAttemptRepository testAttemptRepository;

    @Autowired
    private StudentResponseRepository studentResponseRepository;

    @Autowired
    private SpeakingWritingCriteriaScoreRepository criteriaScoreRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get detailed Speaking/Writing result for student
     * Endpoint: GET /api/test-attempts/{attemptId}/detailed-result
     */
    @GetMapping("/test-attempts/{attemptId}/detailed-result")
    @PreAuthorize("hasRole('STUDENT') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<?> getDetailedResult(@PathVariable Integer attemptId,
                                               @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            System.out.println("🔍 Getting detailed Speaking/Writing result for attempt: " + attemptId);

            // 1. Get test attempt
            TestAttempt attempt = testAttemptRepository.findById(attemptId).orElse(null);
            if (attempt == null) {
                return ResponseEntity.notFound().build();
            }

            // 2. Permission check
            User currentUser = userRepository.findById(userDetails.getId()).orElse(null);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }

            // Students can only see their own results, teachers/admins can see all
            boolean isStudent = currentUser.getRole() == UserRole.STUDENT;
            boolean isOwner = attempt.getStudent().getId().equals(currentUser.getId());
            boolean isTeacher = currentUser.getRole() == UserRole.TEACHER;
            boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
            boolean isCreator = attempt.getTest().getCreator() != null &&
                    attempt.getTest().getCreator().getId().equals(currentUser.getId());

            if (isStudent && !isOwner) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only view your own test results");
            }

            if (isTeacher && !isCreator && !isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You can only view results for tests you created");
            }

            System.out.println("✅ Permission check passed for user: " + currentUser.getEmail());

            // 3. Check if this is a Speaking/Writing test
            TestType testType = attempt.getTest().getTestType();
            if (testType != TestType.SPEAKING && testType != TestType.WRITING) {
                return ResponseEntity.badRequest()
                        .body("This endpoint is only for Speaking/Writing tests");
            }

            // 4. Build detailed result DTO
            SpeakingWritingResultDTO result = buildDetailedResult(attempt);

            System.out.println("✅ Detailed result built successfully for attempt: " + attemptId);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("❌ Error getting detailed result: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting detailed result: " + e.getMessage());
        }
    }

    /**
     * Build detailed result DTO from database entities
     */
    private SpeakingWritingResultDTO buildDetailedResult(TestAttempt attempt) {
        System.out.println("🔧 Building detailed result for attempt: " + attempt.getId());

        SpeakingWritingResultDTO result = new SpeakingWritingResultDTO();

        // Basic attempt info
        result.setAttemptId(attempt.getId());
        result.setTestId(attempt.getTest().getId());
        result.setTestName(attempt.getTest().getTestName());
        result.setTestType(attempt.getTest().getTestType().toString());

        if (attempt.getStudent() != null) {
            result.setStudentId(attempt.getStudent().getId());
            result.setStudentName(attempt.getStudent().getFullName());
            result.setStudentEmail(attempt.getStudent().getEmail());
        }

        result.setSubmittedAt(attempt.getEndTime());
        result.setIsCompleted(attempt.getIsCompleted());

        // Overall score from attempt
        result.setOverallScore(attempt.getTotalScore());

        // Get all responses for this attempt
        List<StudentResponse> responses = studentResponseRepository.findByAttemptIdOrderByQuestionOrder(attempt.getId());
        System.out.println("Found " + responses.size() + " responses for attempt");

        // Get overall feedback from first response (since all responses share same criteria)
        String overallFeedback = null;
        Map<String, Object> criteriaScores = new HashMap<>();

        if (!responses.isEmpty()) {
            // Get criteria scores from first response
            Optional<SpeakingWritingCriteriaScore> criteriaScore =
                    criteriaScoreRepository.findByResponse(responses.get(0));

            if (criteriaScore.isPresent()) {
                SpeakingWritingCriteriaScore score = criteriaScore.get();
                overallFeedback = score.getMarkerComments();

                // Map criteria scores based on test type
                if ("SPEAKING".equals(result.getTestType())) {
                    criteriaScores.put("fluency", score.getFluencyPronunciation());
                    criteriaScores.put("lexical", score.getLexicalResource());
                    criteriaScores.put("grammar", score.getGrammaticalAccuracy());
                    criteriaScores.put("pronunciation", score.getFluencyPronunciation()); // Same as fluency
                } else if ("WRITING".equals(result.getTestType())) {
                    criteriaScores.put("task_achievement", score.getTaskAchievement());
                    criteriaScores.put("coherence", score.getCoherenceCohesion());
                    criteriaScores.put("lexical", score.getLexicalResource());
                    criteriaScores.put("grammar", score.getGrammaticalAccuracy());
                }

                result.setGradedAt(score.getGradedAt());
                System.out.println("✅ Found criteria scores for " + result.getTestType() + " test");
            } else {
                System.out.println("⚠️ No criteria scores found - test may not be graded yet");
            }
        }

        result.setOverallFeedback(overallFeedback);
        result.setCriteriaScores(criteriaScores);

        // Build response DTOs
        List<SpeakingWritingResultDTO.ResponseDTO> responseDTOs = new ArrayList<>();

        for (int i = 0; i < responses.size(); i++) {
            StudentResponse response = responses.get(i);
            SpeakingWritingResultDTO.ResponseDTO responseDTO = new SpeakingWritingResultDTO.ResponseDTO();

            responseDTO.setId(response.getId());
            responseDTO.setQuestionNumber(i + 1); // Display number

            if (response.getQuestion() != null) {
                responseDTO.setQuestionId(response.getQuestion().getId());
                responseDTO.setQuestionText(response.getQuestion().getQuestionText());
                responseDTO.setQuestionType(response.getQuestion().getQuestionType().toString());
            }

            // Response content
            responseDTO.setResponseText(response.getResponseText());
            responseDTO.setAudioBase64(response.getAudioBase64());
            responseDTO.setAudioDuration(response.getAudioDurationSeconds());
            responseDTO.setAudioFileType(response.getAudioFileType());
            responseDTO.setAudioFileSize(response.getAudioFileSize());

            // Individual feedback for this response
            responseDTO.setFeedback(response.getFeedback());
            responseDTO.setFeedbackGivenAt(response.getFeedbackGivenAt());

            // Score info
            responseDTO.setManualScore(response.getManualScore());
            responseDTO.setIsCorrect(response.getIsCorrect());

            responseDTOs.add(responseDTO);
        }

        result.setResponses(responseDTOs);

        // Performance summary
        if (result.getOverallScore() != null) {
            double score = result.getOverallScore().doubleValue();
            if (score >= 7.0) {
                result.setPerformanceLevel("Excellent");
                result.setPerformanceSummary("Outstanding performance with strong language skills");
            } else if (score >= 6.0) {
                result.setPerformanceLevel("Good");
                result.setPerformanceSummary("Good performance with competent language use");
            } else if (score >= 5.0) {
                result.setPerformanceLevel("Satisfactory");
                result.setPerformanceSummary("Adequate performance with room for improvement");
            } else {
                result.setPerformanceLevel("Needs Improvement");
                result.setPerformanceSummary("Significant improvement needed in language skills");
            }
        } else {
            result.setPerformanceLevel("Pending");
            result.setPerformanceSummary("Assessment is being reviewed by instructor");
        }

        System.out.println("✅ Built detailed result with " + responseDTOs.size() + " responses");
        return result;
    }
}