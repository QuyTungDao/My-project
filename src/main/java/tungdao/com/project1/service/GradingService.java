package tungdao.com.project1.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tungdao.com.project1.dto.GradingRequest;
import tungdao.com.project1.entity.SpeakingWritingCriteriaScore;
import tungdao.com.project1.entity.StudentResponse;
import tungdao.com.project1.entity.TestAttempt;
import tungdao.com.project1.repository.SpeakingWritingCriteriaScoreRepository;
import tungdao.com.project1.repository.StudentResponseRepository;
import tungdao.com.project1.repository.TestAttemptRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class GradingService {
    @Autowired
    private SpeakingWritingCriteriaScoreRepository criteriaScoreRepository;

    @Autowired
    private StudentResponseRepository studentResponseRepository;

    @Autowired
    private TestAttemptRepository testAttemptRepository;

    @Transactional
    public Map<String, Object> saveCriteriaGrading(GradingRequest request) {
        System.out.println("=== SAVING CRITERIA GRADING ===");
        System.out.println("Attempt ID: " + request.getAttemptId());
        System.out.println("Overall Score: " + request.getOverallScore());
        System.out.println("Test Type: " + request.getTestType());

        // 1. Get test attempt
        TestAttempt attempt = testAttemptRepository.findById(request.getAttemptId())
                .orElseThrow(() -> new RuntimeException("Test attempt not found: " + request.getAttemptId()));

        // 2. Get all responses for this attempt
        List<StudentResponse> responses = studentResponseRepository.findByAttemptId(request.getAttemptId());

        if (responses.isEmpty()) {
            throw new RuntimeException("No responses found for attempt: " + request.getAttemptId());
        }

        System.out.println("Found " + responses.size() + " responses to grade");

        int savedCount = 0;

        // 3. Save criteria scores for each response
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
                    // pronunciation score can be separate or same as fluency
                    if (criteria.getPronunciation() != null) {
                        criteriaScore.setFluencyPronunciation(
                                averageScores(criteria.getFluency(), criteria.getPronunciation())
                        );
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
                response.setFeedbackGivenAt(LocalDateTime.now());

                studentResponseRepository.save(response);

                savedCount++;
                System.out.println("✅ Saved criteria score for response: " + response.getId());

            } catch (Exception e) {
                System.err.println("❌ Error saving criteria for response " + response.getId() + ": " + e.getMessage());
                // Continue with other responses
            }
        }

        // 4. Update test attempt overall score
        attempt.setTotalScore(request.getOverallScore());

        // Set individual skill scores based on test type
        if ("SPEAKING".equalsIgnoreCase(request.getTestType())) {
            attempt.setSpeakingScore(request.getOverallScore());
        } else if ("WRITING".equalsIgnoreCase(request.getTestType())) {
            attempt.setWritingScore(request.getOverallScore());
        }

        testAttemptRepository.save(attempt);

        System.out.println("✅ Criteria grading completed. Saved: " + savedCount + " responses");

        return Map.of(
                "success", true,
                "message", "Criteria grading saved successfully",
                "attemptId", request.getAttemptId(),
                "overallScore", request.getOverallScore(),
                "savedResponses", savedCount,
                "totalResponses", responses.size()
        );
    }

    // Helper method to average two scores
    private BigDecimal averageScores(BigDecimal score1, BigDecimal score2) {
        if (score1 == null) return score2;
        if (score2 == null) return score1;

        return score1.add(score2)
                .divide(BigDecimal.valueOf(2), 1, RoundingMode.HALF_UP);
    }
}
