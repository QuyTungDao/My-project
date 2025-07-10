package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.Test;
import tungdao.com.project1.entity.TestType;
import tungdao.com.project1.entity.User;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Integer> {

    // ✅ EXISTING SAFE METHODS (keep as is)
    @Query("SELECT t FROM Test t WHERE t.isPublished = true")
    List<Test> findByIsPublishedTrue();

    List<Test> findByTestNameContainingAndIsPublishedTrue(String query);

    List<Test> findByTestTypeAndIsPublishedTrue(String testType);

    @Query("SELECT t FROM Test t WHERE t.creator = :creator ORDER BY t.createdAt DESC")
    List<Test> findByCreatorOrderByCreatedAtDesc(@Param("creator") User creator);

    @Query("SELECT t FROM Test t WHERE t.creator.id = :creatorId ORDER BY t.createdAt DESC")
    List<Test> findByCreatorIdOrderByCreatedAtDesc(@Param("creatorId") Integer creatorId);

    @Query("SELECT t FROM Test t WHERE t.creator = :creator OR t.creator.id = :creatorId ORDER BY t.createdAt DESC")
    List<Test> findByCreatorOrCreatorIdOrderByCreatedAtDesc(@Param("creator") User creator, @Param("creatorId") Integer creatorId);

    @Query("SELECT t FROM Test t WHERE t.creator = :creator AND t.isPublished = true ORDER BY t.createdAt DESC")
    List<Test> findByCreatorAndIsPublishedTrueOrderByCreatedAtDesc(@Param("creator") User creator);

    @Query("SELECT t FROM Test t WHERE LOWER(t.testName) LIKE LOWER(CONCAT('%', :testName, '%'))")
    List<Test> findByTestNameContainingIgnoreCase(@Param("testName") String testName);

    @Query("SELECT COUNT(t) FROM Test t WHERE t.creator = :creator")
    Long countByCreator(@Param("creator") User creator);

    @Query("SELECT COUNT(t) FROM Test t WHERE t.creator = :creator AND t.isPublished = true")
    Long countByCreatorAndIsPublishedTrue(@Param("creator") User creator);

    @Query("SELECT COUNT(t) FROM Test t WHERE t.creator = :creator AND t.isPublished = false")
    Long countByCreatorAndIsPublishedFalse(@Param("creator") User creator);

    // ✅ BASIC DASHBOARD COUNT METHODS
    @Query("SELECT COUNT(t) FROM Test t WHERE t.isPublished = true")
    Long countByIsPublishedTrue();

    @Query("SELECT COUNT(t) FROM Test t WHERE t.isPublished = false")
    Long countByIsPublishedFalse();

    @Query("SELECT COUNT(t) FROM Test t WHERE DATE(t.createdAt) = CURRENT_DATE")
    long countTestsCreatedToday();

    @Query("SELECT COUNT(t) FROM Test t WHERE t.createdAt >= :since")
    long countTestsCreatedSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(t) FROM Test t WHERE DATE(t.updatedAt) = CURRENT_DATE AND t.isPublished = true")
    long countTestsPublishedToday();

    @Query("SELECT COUNT(t) FROM Test t WHERE t.testType = :testType")
    long countByTestType(@Param("testType") TestType testType);

    // ✅ ENHANCED: Test Attempt Analytics (now with attempts relationship)
    @Query("SELECT COUNT(DISTINCT t) FROM Test t JOIN t.attempts ta WHERE t.isPublished = true")
    long countTestsWithAttempts();

    @Query("SELECT t FROM Test t LEFT JOIN t.attempts ta " +
            "WHERE t.isPublished = true " +
            "GROUP BY t.id " +
            "ORDER BY COUNT(ta.id) DESC")
    List<Test> findPopularTests();

    @Query("SELECT COUNT(ta) FROM Test t JOIN t.attempts ta")
    long countTotalTestAttempts();

    @Query("SELECT COUNT(ta) FROM Test t JOIN t.attempts ta WHERE DATE(ta.createdAt) = CURRENT_DATE")
    long countTestAttemptsToday();

    // ✅ COMPREHENSIVE TEST STATISTICS
    @Query("SELECT new map(" +
            "COUNT(t) as totalTests, " +
            "COUNT(CASE WHEN t.isPublished = true THEN 1 END) as publishedTests, " +
            "COUNT(CASE WHEN t.isPublished = false THEN 1 END) as draftTests, " +
            "COUNT(CASE WHEN t.testType = 'READING' THEN 1 END) as readingTests, " +
            "COUNT(CASE WHEN t.testType = 'LISTENING' THEN 1 END) as listeningTests, " +
            "COUNT(CASE WHEN t.testType = 'WRITING' THEN 1 END) as writingTests, " +
            "COUNT(CASE WHEN t.testType = 'SPEAKING' THEN 1 END) as speakingTests" +
            ") FROM Test t")
    List<Object> getTestStatistics();

    // ✅ RECENT ACTIVITY
    @Query("SELECT t FROM Test t WHERE t.createdAt >= :since ORDER BY t.createdAt DESC")
    List<Test> findRecentlyCreatedTests(@Param("since") LocalDateTime since);

    @Query("SELECT t FROM Test t WHERE t.updatedAt >= :since AND t.isPublished = true ORDER BY t.updatedAt DESC")
    List<Test> findRecentlyPublishedTests(@Param("since") LocalDateTime since);

    // ✅ GRADING AND SCORING ANALYTICS
    @Query("SELECT DISTINCT t FROM Test t " +
            "JOIN t.attempts ta " +
            "JOIN ta.responses sr " +
            "JOIN sr.question q " +
            "WHERE q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') " +
            "AND sr.isCorrect IS NULL " +
            "AND t.creator = :creator")
    List<Test> findTestsWithPendingGrading(@Param("creator") User creator);

    @Query("SELECT COUNT(sr) FROM Test t " +
            "JOIN t.attempts ta " +
            "JOIN ta.responses sr " +
            "JOIN sr.question q " +
            "WHERE q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') " +
            "AND sr.isCorrect IS NULL")
    long countPendingGradingSubmissions();

    // ✅ PERFORMANCE ANALYTICS
    @Query("SELECT t, COUNT(ta) as attemptCount, AVG(ta.totalScore) as avgScore FROM Test t " +
            "LEFT JOIN t.attempts ta " +
            "WHERE t.isPublished = true " +
            "GROUP BY t.id " +
            "ORDER BY attemptCount DESC")
    List<Object[]> getTestsWithPerformanceMetrics();

    @Query("SELECT COUNT(DISTINCT ta.student) FROM Test t JOIN t.attempts ta " +
            "WHERE t.id = :testId")
    long countUniqueStudentsForTest(@Param("testId") Integer testId);

    @Query("SELECT AVG(ta.totalScore) FROM Test t JOIN t.attempts ta " +
            "WHERE t.id = :testId")
    Double getAverageScoreForTest(@Param("testId") Integer testId);

    // ✅ TODAY'S ACTIVITY ANALYTICS
    @Query("SELECT COUNT(DISTINCT ta.student) FROM Test t JOIN t.attempts ta " +
            "WHERE DATE(ta.createdAt) = CURRENT_DATE")
    long countActiveStudentsToday();

    @Query("SELECT COUNT(ta) FROM Test t JOIN t.attempts ta " +
            "WHERE DATE(ta.createdAt) = CURRENT_DATE")
    long countTestAttemptsCompletedToday();

    // ✅ TEST TYPE ANALYTICS
    @Query("SELECT t.testType, COUNT(t) FROM Test t " +
            "WHERE t.isPublished = true " +
            "GROUP BY t.testType " +
            "ORDER BY COUNT(t) DESC")
    List<Object[]> getTestTypeStatistics();

    @Query("SELECT t.testType, COUNT(ta) FROM Test t " +
            "LEFT JOIN t.attempts ta " +
            "WHERE t.isPublished = true " +
            "GROUP BY t.testType " +
            "ORDER BY COUNT(ta) DESC")
    List<Object[]> getTestTypeAttemptStatistics();

    // ✅ ADVANCED SEARCH AND FILTERING
    @Query("SELECT t FROM Test t WHERE " +
            "(:testName IS NULL OR LOWER(t.testName) LIKE LOWER(CONCAT('%', :testName, '%'))) AND " +
            "(:testType IS NULL OR t.testType = :testType) AND " +
            "(:isPublished IS NULL OR t.isPublished = :isPublished) AND " +
            "(:creatorId IS NULL OR t.creator.id = :creatorId) " +
            "ORDER BY t.createdAt DESC")
    List<Test> findTestsByMultipleCriteria(
            @Param("testName") String testName,
            @Param("testType") TestType testType,
            @Param("isPublished") Boolean isPublished,
            @Param("creatorId") Integer creatorId
    );

    @Query("SELECT t FROM Test t WHERE t.createdAt >= :sinceDate ORDER BY t.createdAt DESC")
    List<Test> findRecentTests(@Param("sinceDate") LocalDateTime sinceDate);

    // ✅ OWNERSHIP AND PERMISSIONS
    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Test t WHERE t.id = :testId AND t.creator.id = :userId")
    boolean isUserCreatorOfTest(@Param("testId") Integer testId, @Param("userId") Integer userId);

    // ✅ TIME-BASED QUERIES
    @Query("SELECT t FROM Test t WHERE t.createdAt >= :fromDate ORDER BY t.createdAt DESC")
    List<Test> findTestsCreatedSince(@Param("fromDate") LocalDateTime fromDate);

    @Query("SELECT t FROM Test t WHERE t.updatedAt >= :fromDate ORDER BY t.updatedAt DESC")
    List<Test> findTestsUpdatedSince(@Param("fromDate") LocalDateTime fromDate);

    @Query(value = "SELECT * FROM tests t WHERE t.creator_id = :creatorId ORDER BY t.created_at DESC LIMIT :limit", nativeQuery = true)
    List<Test> findRecentTestsByCreator(@Param("creatorId") Integer creatorId, @Param("limit") int limit);

    @Query("SELECT t FROM Test t WHERE t.creator = :creator AND t.isPublished = :isPublished ORDER BY t.updatedAt DESC")
    List<Test> findByCreatorAndIsPublished(@Param("creator") User creator, @Param("isPublished") Boolean isPublished);

    @Query("SELECT t FROM Test t WHERE t.creator = :creator")
    List<Test> findByCreator(@Param("creator") User creator);

    @Query("SELECT t FROM Test t WHERE t.creator.id = :creatorId")
    List<Test> findByCreatorId(@Param("creatorId") Integer creatorId);

    // ✅ ADDITIONAL ANALYTICS FOR DASHBOARD
    @Query("SELECT COUNT(t) FROM Test t")
    long getTotalTests();

    @Query("SELECT COUNT(t) FROM Test t WHERE t.isPublished = true")
    long getPublishedTests();

    @Query("SELECT COUNT(t) FROM Test t WHERE t.isPublished = false")
    long getDraftTests();

    @Query("SELECT COUNT(t) FROM Test t WHERE t.testType = 'READING'")
    long getReadingTestCount();

    @Query("SELECT COUNT(t) FROM Test t WHERE t.testType = 'LISTENING'")
    long getListeningTestCount();

    @Query("SELECT COUNT(t) FROM Test t WHERE t.testType = 'WRITING'")
    long getWritingTestCount();

    @Query("SELECT COUNT(t) FROM Test t WHERE t.testType = 'SPEAKING'")
    long getSpeakingTestCount();

    // ✅ SCORE ANALYTICS
    @Query("SELECT AVG(ta.totalScore) FROM Test t JOIN t.attempts ta")
    Double getOverallAverageScore();

    @Query("SELECT t.testType, AVG(ta.totalScore) FROM Test t " +
            "JOIN t.attempts ta " +
            "GROUP BY t.testType")
    List<Object[]> getAverageScoresByTestType();

    // ✅ COMPLETION RATE ANALYTICS
    @Query("SELECT t, COUNT(ta) as completions FROM Test t " +
            "LEFT JOIN t.attempts ta " +
            "WHERE t.isPublished = true " +
            "GROUP BY t.id " +
            "HAVING COUNT(ta) > 0 " +
            "ORDER BY completions DESC")
    List<Object[]> getMostCompletedTests();
}