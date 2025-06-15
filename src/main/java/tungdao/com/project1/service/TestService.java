package tungdao.com.project1.service;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import tungdao.com.project1.entity.Test;
import tungdao.com.project1.entity.User;
import tungdao.com.project1.repository.*;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TestService {
    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final ReadingPassageRepository readingPassageRepository;
    private final ListeningAudioRepository listeningAudioRepository;
    private final CorrectAnswerRepository correctAnswerRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final StudentResponseRepository studentResponseRepository;

    public TestService(
            TestRepository testRepository,
            QuestionRepository questionRepository,
            ReadingPassageRepository readingPassageRepository,
            ListeningAudioRepository listeningAudioRepository,
            CorrectAnswerRepository correctAnswerRepository,
            TestAttemptRepository testAttemptRepository,
            StudentResponseRepository studentResponseRepository) {
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.readingPassageRepository = readingPassageRepository;
        this.listeningAudioRepository = listeningAudioRepository;
        this.correctAnswerRepository = correctAnswerRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.studentResponseRepository = studentResponseRepository;
    }

    // ✅ EXISTING METHODS (keep as is)
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

    // ✅ NEW METHODS FOR ROLE-BASED ACCESS

    /**
     * Get all tests (for Admin only)
     */
    public List<Test> getAllTests() {
        System.out.println("=== GET ALL TESTS (ADMIN) ===");
        List<Test> allTests = testRepository.findAll();
        System.out.println("Found " + allTests.size() + " total tests");
        return allTests;
    }

    /**
     * Get tests created by specific user (for Teachers to see their own tests)
     */
    public List<Test> getTestsByCreator(User creator) {
        System.out.println("=== GET TESTS BY CREATOR ===");
        System.out.println("Getting tests created by: " + creator.getEmail());

        List<Test> userTests = testRepository.findByCreatorOrderByCreatedAtDesc(creator);
        System.out.println("Found " + userTests.size() + " tests for user: " + creator.getEmail());

        for (Test test : userTests) {
            System.out.println("  - Test ID: " + test.getId() +
                    ", Name: " + test.getTestName() +
                    ", Published: " + test.getIsPublished() +
                    ", Type: " + test.getTestType());
        }

        return userTests;
    }

    /**
     * Get tests by creator ID (alternative method)
     */
    public List<Test> getTestsByCreatorId(Integer creatorId) {
        System.out.println("=== GET TESTS BY CREATOR ID ===");
        System.out.println("Getting tests created by user ID: " + creatorId);

        List<Test> userTests = testRepository.findByCreatorIdOrderByCreatedAtDesc(creatorId);
        System.out.println("Found " + userTests.size() + " tests for creator ID: " + creatorId);

        return userTests;
    }

    /**
     * Get published tests by creator (for public viewing of teacher's published tests)
     */
    public List<Test> getPublishedTestsByCreator(User creator) {
        System.out.println("=== GET PUBLISHED TESTS BY CREATOR ===");
        System.out.println("Getting published tests by: " + creator.getEmail());

        List<Test> publishedTests = testRepository.findByCreatorAndIsPublishedTrueOrderByCreatedAtDesc(creator);
        System.out.println("Found " + publishedTests.size() + " published tests for: " + creator.getEmail());

        return publishedTests;
    }

    /**
     * Check if user owns the test
     */
    public boolean isTestOwner(Integer testId, Integer userId) {
        System.out.println("=== CHECK TEST OWNERSHIP ===");
        System.out.println("Checking if user " + userId + " owns test " + testId);

        Test test = getTestById(testId);
        if (test == null) {
            System.out.println("❌ Test not found: " + testId);
            return false;
        }

        if (test.getCreator() == null) {
            System.out.println("❌ Test has no creator: " + testId);
            return false;
        }

        boolean isOwner = test.getCreator().getId().equals(userId);
        System.out.println(isOwner ? "✅ User owns the test" : "❌ User does not own the test");

        return isOwner;
    }

    /**
     * Search tests with additional creator info (for admin search)
     */
    public List<Test> searchAllTests(String query) {
        System.out.println("=== SEARCH ALL TESTS (ADMIN) ===");
        System.out.println("Searching all tests with query: " + query);

        List<Test> results = testRepository.findByTestNameContainingIgnoreCase(query);
        System.out.println("Found " + results.size() + " tests matching: " + query);

        return results;
    }

    /**
     * ✅ FIXED: Get recent tests (last 30 days) using LocalDateTime parameter
     */
    public List<Test> getRecentTests() {
        System.out.println("=== GET RECENT TESTS ===");
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        System.out.println("Getting tests created since: " + thirtyDaysAgo);

        List<Test> recentTests = testRepository.findRecentTests(thirtyDaysAgo);
        System.out.println("Found " + recentTests.size() + " recent tests");

        return recentTests;
    }

    /**
     * ✅ NEW: Get recent tests for a specific creator
     */
    public List<Test> getRecentTestsByCreator(User creator, int days) {
        System.out.println("=== GET RECENT TESTS BY CREATOR ===");
        LocalDateTime sinceDate = LocalDateTime.now().minusDays(days);
        System.out.println("Getting tests by " + creator.getEmail() + " since: " + sinceDate);

        List<Test> recentTests = testRepository.findTestsCreatedSince(sinceDate);
        System.out.println("Found " + recentTests.size() + " recent tests by creator");

        return recentTests;
    }

    /**
     * Get test statistics for dashboard
     */
    public TestStatistics getTestStatistics(User user) {
        System.out.println("=== GET TEST STATISTICS ===");
        System.out.println("Getting statistics for user: " + user.getEmail());

        TestStatistics stats = new TestStatistics();

        if (user.getRole().toString().equals("ADMIN")) {
            // Admin sees all statistics
            stats.setTotalTests(testRepository.count());
            stats.setPublishedTests(testRepository.countByIsPublishedTrue());
            stats.setDraftTests(testRepository.countByIsPublishedFalse());
            stats.setTotalAttempts(testAttemptRepository.count());
            System.out.println("✅ Admin statistics calculated");

        } else if (user.getRole().toString().equals("TEACHER")) {
            // Teacher sees their own statistics
            stats.setTotalTests(testRepository.countByCreator(user));
            stats.setPublishedTests(testRepository.countByCreatorAndIsPublishedTrue(user));
            stats.setDraftTests(testRepository.countByCreatorAndIsPublishedFalse(user));
            stats.setTotalAttempts(testAttemptRepository.countByTestCreator(user));
            System.out.println("✅ Teacher statistics calculated");

        } else {
            // Student sees their attempt statistics
            stats.setTotalAttempts(testAttemptRepository.countByStudentId(user.getId()));
            stats.setCompletedAttempts(testAttemptRepository.countByStudentIdAndIsCompletedTrue(user.getId()));
            System.out.println("✅ Student statistics calculated");
        }

        return stats;
    }

    // ✅ EXISTING DELETE METHODS (keep as is)
    @Transactional
    public void deleteTest(Integer id) {
        // Kiểm tra bài thi tồn tại không
        Test test = getTestById(id);
        if (test == null) {
            throw new RuntimeException("Không tìm thấy bài thi với ID: " + id);
        }

        // Xóa các câu trả lời của học viên liên quan
        List<Integer> questionIds = questionRepository.findQuestionIdsByTestId(id);
        if (!questionIds.isEmpty()) {
            studentResponseRepository.deleteByQuestionIdIn(questionIds);
            correctAnswerRepository.deleteByQuestionIdIn(questionIds);
        }

        // Xóa các lần làm bài
        testAttemptRepository.deleteByTestId(id);

        // Xóa các câu hỏi
        questionRepository.deleteByTestId(id);

        // Xóa đoạn văn reading
        readingPassageRepository.deleteByTestId(id);

        // Xóa file audio
        listeningAudioRepository.deleteByTestId(id);

        // Xóa bài thi
        testRepository.deleteById(id);
    }

    @Transactional
    public void deleteRelatedData(Integer testId) {
        System.out.println("Đang xóa dữ liệu liên quan của bài thi ID: " + testId);

        // Xóa các câu trả lời của học viên liên quan
        List<Integer> questionIds = questionRepository.findQuestionIdsByTestId(testId);
        if (!questionIds.isEmpty()) {
            studentResponseRepository.deleteByQuestionIdIn(questionIds);
            correctAnswerRepository.deleteByQuestionIdIn(questionIds);
        }

        // Xóa các lần làm bài
        testAttemptRepository.deleteByTestId(testId);

        // Xóa các câu hỏi
        questionRepository.deleteByTestId(testId);

        // Xóa đoạn văn reading
        readingPassageRepository.deleteByTestId(testId);

        // Xóa file audio
        listeningAudioRepository.deleteByTestId(testId);

        System.out.println("Đã xóa thành công tất cả dữ liệu liên quan");
    }

    // ✅ INNER CLASS FOR STATISTICS
    public static class TestStatistics {
        private Long totalTests = 0L;
        private Long publishedTests = 0L;
        private Long draftTests = 0L;
        private Long totalAttempts = 0L;
        private Long completedAttempts = 0L;

        // Getters and setters
        public Long getTotalTests() { return totalTests; }
        public void setTotalTests(Long totalTests) { this.totalTests = totalTests; }

        public Long getPublishedTests() { return publishedTests; }
        public void setPublishedTests(Long publishedTests) { this.publishedTests = publishedTests; }

        public Long getDraftTests() { return draftTests; }
        public void setDraftTests(Long draftTests) { this.draftTests = draftTests; }

        public Long getTotalAttempts() { return totalAttempts; }
        public void setTotalAttempts(Long totalAttempts) { this.totalAttempts = totalAttempts; }

        public Long getCompletedAttempts() { return completedAttempts; }
        public void setCompletedAttempts(Long completedAttempts) { this.completedAttempts = completedAttempts; }
    }
}