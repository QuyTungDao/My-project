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

    // ✅ EXISTING METHODS (keep as is)
    @Query("SELECT t FROM Test t WHERE t.isPublished = true")
    List<Test> findByIsPublishedTrue();

    List<Test> findByTestNameContainingAndIsPublishedTrue(String query);

    List<Test> findByTestTypeAndIsPublishedTrue(String testType);

    // ✅ NEW METHODS FOR ROLE-BASED ACCESS:

    /**
     * Find all tests by creator, ordered by creation date (newest first)
     */
    @Query("SELECT t FROM Test t WHERE t.creator = :creator ORDER BY t.createdAt DESC")
    List<Test> findByCreatorOrderByCreatedAtDesc(@Param("creator") User creator);

    /**
     * Find tests by creator ID, ordered by creation date (newest first)
     */
    @Query("SELECT t FROM Test t WHERE t.creator.id = :creatorId ORDER BY t.createdAt DESC")
    List<Test> findByCreatorIdOrderByCreatedAtDesc(@Param("creatorId") Integer creatorId);

    /**
     * Find published tests by creator, ordered by creation date (newest first)
     */
    @Query("SELECT t FROM Test t WHERE t.creator = :creator AND t.isPublished = true ORDER BY t.createdAt DESC")
    List<Test> findByCreatorAndIsPublishedTrueOrderByCreatedAtDesc(@Param("creator") User creator);

    /**
     * Search tests by name (case insensitive) - for admin search
     */
    @Query("SELECT t FROM Test t WHERE LOWER(t.testName) LIKE LOWER(CONCAT('%', :testName, '%'))")
    List<Test> findByTestNameContainingIgnoreCase(@Param("testName") String testName);

    /**
     * Count total tests by creator
     */
    @Query("SELECT COUNT(t) FROM Test t WHERE t.creator = :creator")
    Long countByCreator(@Param("creator") User creator);

    /**
     * Count published tests by creator
     */
    @Query("SELECT COUNT(t) FROM Test t WHERE t.creator = :creator AND t.isPublished = true")
    Long countByCreatorAndIsPublishedTrue(@Param("creator") User creator);

    /**
     * Count draft (unpublished) tests by creator
     */
    @Query("SELECT COUNT(t) FROM Test t WHERE t.creator = :creator AND t.isPublished = false")
    Long countByCreatorAndIsPublishedFalse(@Param("creator") User creator);

    /**
     * Count total published tests (for admin statistics)
     */
    @Query("SELECT COUNT(t) FROM Test t WHERE t.isPublished = true")
    Long countByIsPublishedTrue();

    /**
     * Count total draft tests (for admin statistics)
     */
    @Query("SELECT COUNT(t) FROM Test t WHERE t.isPublished = false")
    Long countByIsPublishedFalse();

    /**
     * Find tests by multiple criteria (for advanced search)
     */
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

    /**
     * Find recent tests (using parameter instead of CURRENT_DATE arithmetic)
     */
    @Query("SELECT t FROM Test t WHERE t.createdAt >= :sinceDate ORDER BY t.createdAt DESC")
    List<Test> findRecentTests(@Param("sinceDate") LocalDateTime sinceDate);

    /**
     * Find popular tests (most attempted) - for recommendations
     */
    @Query("SELECT t FROM Test t LEFT JOIN t.attempts ta " +
            "WHERE t.isPublished = true " +
            "GROUP BY t.id " +
            "ORDER BY COUNT(ta.id) DESC")
    List<Test> findPopularTests();

    /**
     * Find tests with pending grading (have writing/speaking responses)
     */
    @Query("SELECT DISTINCT t FROM Test t " +
            "JOIN t.attempts ta " +
            "JOIN ta.responses sr " +
            "JOIN sr.question q " +
            "WHERE q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') " +
            "AND sr.isCorrect IS NULL " +
            "AND t.creator = :creator")
    List<Test> findTestsWithPendingGrading(@Param("creator") User creator);

    /**
     * Check if user is creator of test
     */
    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Test t WHERE t.id = :testId AND t.creator.id = :userId")
    boolean isUserCreatorOfTest(@Param("testId") Integer testId, @Param("userId") Integer userId);

    /**
     * Find tests created in the last N days
     */
    @Query("SELECT t FROM Test t WHERE t.createdAt >= :fromDate ORDER BY t.createdAt DESC")
    List<Test> findTestsCreatedSince(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Find tests updated in the last N days
     */
    @Query("SELECT t FROM Test t WHERE t.updatedAt >= :fromDate ORDER BY t.updatedAt DESC")
    List<Test> findTestsUpdatedSince(@Param("fromDate") LocalDateTime fromDate);

    /**
     * Find most recent tests by creator (limit results)
     */
    @Query("SELECT t FROM Test t WHERE t.creator = :creator ORDER BY t.createdAt DESC LIMIT :limit")
    List<Test> findRecentTestsByCreator(@Param("creator") User creator, @Param("limit") int limit);

    /**
     * Find tests by status and creator
     */
    @Query("SELECT t FROM Test t WHERE t.creator = :creator AND t.isPublished = :isPublished ORDER BY t.updatedAt DESC")
    List<Test> findByCreatorAndIsPublished(@Param("creator") User creator, @Param("isPublished") Boolean isPublished);
}