package tungdao.com.project1.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tungdao.com.project1.dto.TestAttemptDTO;
import tungdao.com.project1.entity.StudentResponse;
import tungdao.com.project1.entity.TestAttempt;
import tungdao.com.project1.entity.User;
import tungdao.com.project1.mapper.TestAttemptMapper;
import tungdao.com.project1.repository.TestAttemptRepository;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TestAttemptService {
    private final TestAttemptRepository testAttemptRepository;
    private final TestAttemptMapper testAttemptMapper;

    @Autowired
    public TestAttemptService(TestAttemptRepository tar, TestAttemptMapper mapper) {
        this.testAttemptRepository = tar;
        this.testAttemptMapper = mapper;
    }

    public TestAttempt saveTestAttempt(TestAttempt attempt) {
        return testAttemptRepository.save(attempt);
    }

    public TestAttempt getTestAttemptById(Integer id) {
        System.out.println("=== SERVICE: Getting TestAttempt by ID: " + id + " ===");

        TestAttempt attempt = testAttemptRepository.findByIdWithResponses(id);

        if (attempt != null) {
            System.out.println("Found attempt: " + attempt.getId());

            // ✅ DEBUG: Log grading fields from entity
            System.out.println("=== ENTITY GRADING DEBUG ===");
            System.out.println("Grading Status: " + attempt.getGradingStatus());
            System.out.println("Overall Score: " + attempt.getOverallScore());
            System.out.println("Total Score: " + attempt.getTotalScore());
            System.out.println("Grader: " + (attempt.getGrader() != null ? attempt.getGrader().getFullName() : "null"));
            System.out.println("Graded At: " + attempt.getGradedAt());
            System.out.println("Overall Feedback: " + attempt.getOverallFeedback());

            // ✅ FORCE LOAD responses to avoid lazy loading issues
            if (attempt.getResponses() != null) {
                int responseCount = attempt.getResponses().size();
                System.out.println("Forced loading responses: " + responseCount);

                // Iterate to ensure full loading
                for (StudentResponse response : attempt.getResponses()) {
                    if (response.getQuestion() != null) {
                        // Touch the question to ensure it's loaded
                        response.getQuestion().getId();
                    }
                }
            } else {
                System.err.println("❌ Responses is null for attempt: " + id);
            }
        }

        return attempt;
    }

    // ✅ NEW METHOD: Get TestAttempt as DTO with proper mapping
    public TestAttemptDTO getTestAttemptDTOById(Integer id) {
        System.out.println("=== SERVICE: Getting TestAttemptDTO by ID: " + id + " ===");

        TestAttempt attempt = getTestAttemptById(id);
        if (attempt == null) {
            return null;
        }

        // ✅ Use the proper mapper
        TestAttemptDTO dto = testAttemptMapper.toDTO(attempt);

        // ✅ MANUAL GRADING FIELDS MAPPING (as backup)
        if (dto != null) {
            // Map grading fields manually to ensure they're set
            if (attempt.getGrader() != null) {
                dto.setGraderId(attempt.getGrader().getId());
                dto.setGraderName(attempt.getGrader().getFullName());
            }
            dto.setGradedAt(attempt.getGradedAt());
            dto.setOverallFeedback(attempt.getOverallFeedback());
            dto.setOverallScore(attempt.getOverallScore());

            // Set grading status
            if (attempt.getGradingStatus() != null) {
                dto.setGradingStatus(attempt.getGradingStatus().getCode());
            } else {
                dto.setGradingStatus("PENDING");
            }

            // Set final score
            if (attempt.getOverallScore() != null) {
                dto.setFinalScore(attempt.getOverallScore());
            } else {
                dto.setFinalScore(attempt.getTotalScore());
            }

            // Set test type
            if (attempt.getTest() != null && attempt.getTest().getTestType() != null) {
                dto.setTestType(attempt.getTest().getTestType().name());
            }

            // ✅ DEBUG: Log DTO grading fields
            System.out.println("=== DTO GRADING DEBUG ===");
            System.out.println("DTO Grading Status: " + dto.getGradingStatus());
            System.out.println("DTO Overall Score: " + dto.getOverallScore());
            System.out.println("DTO Final Score: " + dto.getFinalScore());
            System.out.println("DTO Grader ID: " + dto.getGraderId());
            System.out.println("DTO Grader Name: " + dto.getGraderName());
            System.out.println("DTO Graded At: " + dto.getGradedAt());
        }

        return dto;
    }

    public List<TestAttempt> getTestAttemptsByUserId(Integer userId) {
        System.out.println("=== SERVICE: Getting TestAttempts for user: " + userId + " ===");

        List<TestAttempt> attempts = testAttemptRepository.findByStudentIdWithResponsesOrderByStartTimeDesc(userId);

        // Optional: Force load lazy collection
        for (TestAttempt attempt : attempts) {
            if (attempt.getResponses() != null) {
                attempt.getResponses().size();
            }
        }

        return attempts;
    }

    // ✅ NEW METHOD: Get TestAttempts as DTOs for user
    public List<TestAttemptDTO> getTestAttemptDTOsByUserId(Integer userId) {
        List<TestAttempt> attempts = getTestAttemptsByUserId(userId);
        return testAttemptMapper.toDTOList(attempts);
    }

    public List<TestAttempt> getTestAttemptsByTestId(Integer testId) {
        return testAttemptRepository.findByTestIdOrderByStartTimeDesc(testId);
    }

    public void deleteTestAttempt(Integer id) {
        testAttemptRepository.deleteById(id);
    }

    public Map<String, Object> getUserTestStatistics(User user) {
        try {
            List<TestAttempt> attempts = getTestAttemptsByUserId(user.getId());

            if (attempts.isEmpty()) {
                return createEmptyTestStats();
            }

            // Calculate basic stats - FIX: Convert BigDecimal to double
            int totalTests = attempts.size();
            double averageScore = attempts.stream()
                    .filter(attempt -> attempt.getTotalScore() != null) // Filter out null scores
                    .mapToDouble(attempt -> attempt.getTotalScore().doubleValue()) // Convert BigDecimal to double
                    .average()
                    .orElse(0.0);

            // Group by test type to find strongest/weakest skills
            Map<String, List<TestAttempt>> skillGroups = attempts.stream()
                    .collect(Collectors.groupingBy(attempt ->
                            attempt.getTest().getTestType() != null ?
                                    attempt.getTest().getTestType().toString() : "READING"));

            // Calculate skill averages - FIX: Convert BigDecimal to double
            Map<String, Double> skillAverages = skillGroups.entrySet().stream()
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            entry -> entry.getValue().stream()
                                    .filter(attempt -> attempt.getTotalScore() != null) // Filter out null scores
                                    .mapToDouble(attempt -> attempt.getTotalScore().doubleValue()) // Convert BigDecimal to double
                                    .average()
                                    .orElse(0.0)
                    ));

            String strongestSkill = skillAverages.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("N/A");

            String weakestSkill = skillAverages.entrySet().stream()
                    .min(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("N/A");

            // Calculate study streak
            int studyStreak = calculateStudyStreak(attempts);

            // Estimate total study hours (average 1.2 hours per test)
            double totalStudyHours = totalTests * 1.2;

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalTests", totalTests);
            stats.put("averageScore", Math.round(averageScore * 10.0) / 10.0);
            stats.put("strongestSkill", strongestSkill);
            stats.put("weakestSkill", weakestSkill);
            stats.put("studyStreak", studyStreak);
            stats.put("totalStudyHours", Math.round(totalStudyHours * 10.0) / 10.0);
            stats.put("skillBreakdown", skillAverages);

            return stats;
        } catch (Exception e) {
            System.err.println("Error calculating user test statistics: " + e.getMessage());
            return createEmptyTestStats();
        }
    }

    /**
     * Calculate consecutive study days streak
     */
    private int calculateStudyStreak(List<TestAttempt> attempts) {
        if (attempts.isEmpty()) return 0;

        // Sort attempts by end time (most recent first)
        List<TestAttempt> sortedAttempts = attempts.stream()
                .filter(attempt -> attempt.getEndTime() != null)
                .sorted((a, b) -> b.getEndTime().compareTo(a.getEndTime()))
                .collect(Collectors.toList());

        if (sortedAttempts.isEmpty()) return 0;

        Set<LocalDate> studyDates = sortedAttempts.stream()
                .map(attempt -> attempt.getEndTime().toLocalDate())
                .collect(Collectors.toSet());

        List<LocalDate> sortedDates = studyDates.stream()
                .sorted(Collections.reverseOrder())
                .collect(Collectors.toList());

        int streak = 0;
        LocalDate expectedDate = LocalDate.now();

        for (LocalDate studyDate : sortedDates) {
            if (studyDate.equals(expectedDate) || studyDate.equals(expectedDate.minusDays(1))) {
                streak++;
                expectedDate = studyDate.minusDays(1);
            } else {
                break;
            }
        }

        return streak;
    }


    private Map<String, Object> createEmptyTestStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTests", 0);
        stats.put("averageScore", 0.0);
        stats.put("strongestSkill", "N/A");
        stats.put("weakestSkill", "N/A");
        stats.put("studyStreak", 0);
        stats.put("totalStudyHours", 0.0);
        stats.put("skillBreakdown", new HashMap<>());
        return stats;
    }
}