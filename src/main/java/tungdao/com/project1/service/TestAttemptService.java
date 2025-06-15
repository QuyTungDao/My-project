package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
import tungdao.com.project1.entity.StudentResponse;
import tungdao.com.project1.entity.TestAttempt;
import tungdao.com.project1.repository.TestAttemptRepository;

import java.util.List;

@Service
public class TestAttemptService {
    private final TestAttemptRepository testAttemptRepository;

    public TestAttemptService(TestAttemptRepository tar) {
        this.testAttemptRepository = tar;
    }

    public TestAttempt saveTestAttempt(TestAttempt attempt) {
        return testAttemptRepository.save(attempt);
    }

    public TestAttempt getTestAttemptById(Integer id) {
        System.out.println("=== SERVICE: Getting TestAttempt by ID: " + id + " ===");

        TestAttempt attempt = testAttemptRepository.findByIdWithResponses(id);

        if (attempt != null) {
            System.out.println("Found attempt: " + attempt.getId());

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

    public List<TestAttempt> getTestAttemptsByUserId(Integer userId) {
        return testAttemptRepository.findByStudentIdOrderByStartTimeDesc(userId);
    }

    public List<TestAttempt> getTestAttemptsByTestId(Integer testId) {
        return testAttemptRepository.findByTestIdOrderByStartTimeDesc(testId);
    }

    public void deleteTestAttempt(Integer id) {
        testAttemptRepository.deleteById(id);
    }
}