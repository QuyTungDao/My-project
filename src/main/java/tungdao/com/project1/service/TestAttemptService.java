package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
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
        return testAttemptRepository.findByIdWithResponses(id);
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