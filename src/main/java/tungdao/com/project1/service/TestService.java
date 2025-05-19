package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
import tungdao.com.project1.entity.Test;
import tungdao.com.project1.repository.TestRepository;

import java.util.List;

@Service
public class TestService {
    private final TestRepository testRepository;

    public TestService(TestRepository testRepository) {
        this.testRepository = testRepository;
    }

    public List<Test> getAllPublishedTests() {
        List<Test> tests = testRepository.findByIsPublishedTrue();
        System.out.println("Found " + tests.size() + " published tests");
        for (Test test : tests) {
            System.out.println("Test ID: " + test.getId() + ", Name: " + test.getTestName() +
                    ", Is Published: " + test.getIsPublished());
        }
        return tests;
    }

    public Test getTestById(Integer id) {
        return testRepository.findById(id).orElse(null);
    }

    public List<Test> searchTests(String query) {
        return testRepository.findByTestNameContainingAndIsPublishedTrue(query);
    }

    public Test saveTest(Test test) {
        return testRepository.save(test);
    }
}
