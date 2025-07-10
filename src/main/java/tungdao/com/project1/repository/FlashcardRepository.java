package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.FlashCard;
import tungdao.com.project1.entity.User;

import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FlashcardRepository extends JpaRepository<FlashCard, Integer> {

    // ✅ EXISTING METHODS (keep as is)
    List<FlashCard> findByCreator(User creator);

    List<FlashCard> findByCategory(String category);

    @Query("SELECT f FROM FlashCard f WHERE f.word LIKE %:keyword% OR f.meaning LIKE %:keyword%")
    List<FlashCard> searchByKeyword(String keyword);

    List<FlashCard> findBySetNameAndIsActiveTrue(String setName);

    List<FlashCard> findByIsPublicTrueAndIsActiveTrue();

    List<FlashCard> findByCategoryAndDifficultyLevelAndIsActiveTrue(
            String category, FlashCard.DifficultyLevel difficultyLevel);

    @Query("SELECT DISTINCT f.setName FROM FlashCard f WHERE f.setName IS NOT NULL AND f.isActive = true")
    List<String> findAllSetNames();

    @Query("SELECT f.setName, COUNT(f) FROM FlashCard f WHERE f.isActive = true GROUP BY f.setName")
    List<Object[]> countCardsBySet();

    List<FlashCard> findByWordTypeAndIsActiveTrue(FlashCard.WordType wordType);

    // ✅ RESTORED: Now with StudentFlashcardProgress support
    @Query("SELECT f FROM FlashCard f WHERE f.isActive = true AND f.id NOT IN " +
            "(SELECT p.flashcard.id FROM StudentFlashcardProgress p WHERE p.student = :student)")
    List<FlashCard> findNewFlashcardsForStudent(@Param("student") User student, Pageable pageable);

    // ✅ DASHBOARD STATISTICS (Basic counts)
    @Query("SELECT COUNT(f) FROM FlashCard f WHERE f.isActive = true")
    long countActiveFlashcards();

    @Query("SELECT COUNT(f) FROM FlashCard f WHERE f.isPublic = true AND f.isActive = true")
    long countPublicFlashcards();

    @Query("SELECT COUNT(f) FROM FlashCard f WHERE f.isPublic = false AND f.isActive = true")
    long countPrivateFlashcards();

    @Query("SELECT COUNT(f) FROM FlashCard f WHERE DATE(f.createdAt) = CURRENT_DATE AND f.isActive = true")
    long countFlashcardsCreatedToday();

    @Query("SELECT COUNT(f) FROM FlashCard f WHERE f.createdAt >= :since AND f.isActive = true")
    long countFlashcardsCreatedSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(f) FROM FlashCard f WHERE f.difficultyLevel = :difficulty AND f.isActive = true")
    long countByDifficultyLevel(@Param("difficulty") FlashCard.DifficultyLevel difficulty);

    @Query("SELECT COUNT(f) FROM FlashCard f WHERE f.wordType = :wordType AND f.isActive = true")
    long countByWordType(@Param("wordType") FlashCard.WordType wordType);

    @Query("SELECT COUNT(f) FROM FlashCard f WHERE f.category = :category AND f.isActive = true")
    long countByCategory(@Param("category") String category);

    // ✅ COMPREHENSIVE STATISTICS with StudentFlashcardProgress
    @Query("SELECT new map(" +
            "COUNT(f) as totalFlashcards, " +
            "COUNT(CASE WHEN f.isPublic = true THEN 1 END) as publicFlashcards, " +
            "COUNT(CASE WHEN f.isPublic = false THEN 1 END) as privateFlashcards, " +
            "COUNT(CASE WHEN f.difficultyLevel = 'EASY' THEN 1 END) as easyCards, " +
            "COUNT(CASE WHEN f.difficultyLevel = 'MEDIUM' THEN 1 END) as mediumCards, " +
            "COUNT(CASE WHEN f.difficultyLevel = 'HARD' THEN 1 END) as hardCards, " +
            "COUNT(DISTINCT f.setName) as totalSets, " +
            "COUNT(DISTINCT f.category) as totalCategories" +
            ") FROM FlashCard f WHERE f.isActive = true")
    List<Object> getFlashcardStatistics();

    // ✅ STUDY PROGRESS ANALYTICS with StudentFlashcardProgress
    @Query("SELECT f FROM FlashCard f LEFT JOIN f.progressRecords pr " +
            "WHERE f.isActive = true " +
            "GROUP BY f.id " +
            "ORDER BY COUNT(pr.id) DESC")
    List<FlashCard> findMostStudiedFlashcards();

    @Query("SELECT COUNT(pr) FROM FlashCard f JOIN f.progressRecords pr WHERE f.isActive = true")
    long countTotalStudySessions();

    @Query("SELECT COUNT(pr) FROM FlashCard f JOIN f.progressRecords pr " +
            "WHERE f.isActive = true AND DATE(pr.lastReviewed) = CURRENT_DATE")
    long countStudySessionsToday();

    @Query("SELECT f FROM FlashCard f LEFT JOIN f.progressRecords pr " +
            "WHERE f.isActive = true AND f.isPublic = true " +
            "GROUP BY f.id " +
            "HAVING COUNT(pr) > 0 " +
            "ORDER BY COUNT(pr) DESC")
    List<FlashCard> findPopularFlashcards();

    @Query("SELECT f FROM FlashCard f WHERE f.isActive = true " +
            "AND f.id NOT IN (SELECT pr.flashcard.id FROM StudentFlashcardProgress pr)")
    List<FlashCard> findUnusedFlashcards();

    @Query("SELECT COUNT(DISTINCT f) FROM FlashCard f JOIN f.progressRecords pr WHERE f.isActive = true")
    long countFlashcardsWithProgress();

    // ✅ RECENT ACTIVITY
    @Query("SELECT f FROM FlashCard f WHERE f.createdAt >= :since AND f.isActive = true ORDER BY f.createdAt DESC")
    List<FlashCard> findRecentlyCreatedFlashcards(@Param("since") LocalDateTime since);

    // ✅ CREATOR ANALYTICS
    @Query("SELECT COUNT(f) FROM FlashCard f WHERE f.creator = :creator AND f.isActive = true")
    long countByCreator(@Param("creator") User creator);

    @Query("SELECT f.creator FROM FlashCard f WHERE f.isActive = true " +
            "GROUP BY f.creator " +
            "ORDER BY COUNT(f) DESC")
    List<User> findTopFlashcardCreators();

    // ✅ CATEGORY AND SET ANALYTICS
    @Query("SELECT f.category, COUNT(f) FROM FlashCard f " +
            "WHERE f.isActive = true AND f.category IS NOT NULL " +
            "GROUP BY f.category " +
            "ORDER BY COUNT(f) DESC")
    List<Object[]> getCategoryStatistics();

    @Query("SELECT f.setName, COUNT(f) FROM FlashCard f " +
            "WHERE f.isActive = true AND f.setName IS NOT NULL " +
            "GROUP BY f.setName " +
            "ORDER BY COUNT(f) DESC")
    List<Object[]> getSetNameStatistics();

    @Query("SELECT f.difficultyLevel, COUNT(f) FROM FlashCard f " +
            "WHERE f.isActive = true " +
            "GROUP BY f.difficultyLevel " +
            "ORDER BY COUNT(f) DESC")
    List<Object[]> getDifficultyStatistics();

    // ✅ USER-SPECIFIC QUERIES
    @Query("SELECT f FROM FlashCard f WHERE f.creator = :creator " +
            "AND f.createdAt >= :since AND f.isActive = true " +
            "ORDER BY f.createdAt DESC")
    List<FlashCard> findUserFlashcardsCreatedSince(@Param("creator") User creator, @Param("since") LocalDateTime since);

    // ✅ ADVANCED SEARCH
    @Query("SELECT f FROM FlashCard f WHERE f.isActive = true " +
            "AND (:word IS NULL OR LOWER(f.word) LIKE LOWER(CONCAT('%', :word, '%'))) " +
            "AND (:meaning IS NULL OR LOWER(f.meaning) LIKE LOWER(CONCAT('%', :meaning, '%'))) " +
            "AND (:category IS NULL OR f.category = :category) " +
            "AND (:difficulty IS NULL OR f.difficultyLevel = :difficulty) " +
            "AND (:wordType IS NULL OR f.wordType = :wordType) " +
            "AND (:setName IS NULL OR f.setName = :setName) " +
            "AND (:isPublic IS NULL OR f.isPublic = :isPublic) " +
            "ORDER BY f.createdAt DESC")
    List<FlashCard> findFlashcardsByMultipleCriteria(
            @Param("word") String word,
            @Param("meaning") String meaning,
            @Param("category") String category,
            @Param("difficulty") FlashCard.DifficultyLevel difficulty,
            @Param("wordType") FlashCard.WordType wordType,
            @Param("setName") String setName,
            @Param("isPublic") Boolean isPublic
    );

    // ✅ MASTERY LEVEL ANALYTICS with StudentFlashcardProgress
    @Query("SELECT COUNT(pr) FROM StudentFlashcardProgress pr WHERE pr.masteryLevel = 'NEW'")
    long countNewCards();

    @Query("SELECT COUNT(pr) FROM StudentFlashcardProgress pr WHERE pr.masteryLevel = 'LEARNING'")
    long countLearningCards();

    @Query("SELECT COUNT(pr) FROM StudentFlashcardProgress pr WHERE pr.masteryLevel = 'REVIEW'")
    long countReviewCards();

    @Query("SELECT COUNT(pr) FROM StudentFlashcardProgress pr WHERE pr.masteryLevel = 'MASTERED'")
    long countMasteredCards();

    // ✅ STUDY PERFORMANCE ANALYTICS
    @Query("SELECT pr.masteryLevel, COUNT(pr) FROM StudentFlashcardProgress pr " +
            "GROUP BY pr.masteryLevel ORDER BY COUNT(pr) DESC")
    List<Object[]> getMasteryLevelStatistics();

    @Query("SELECT AVG(pr.totalReviews) FROM StudentFlashcardProgress pr")
    Double getAverageReviewCount();

    @Query("SELECT f, COUNT(pr) as reviewCount FROM FlashCard f " +
            "LEFT JOIN f.progressRecords pr " +
            "WHERE f.isActive = true " +
            "GROUP BY f.id " +
            "ORDER BY reviewCount DESC")
    List<Object[]> getFlashcardsWithReviewCounts();

    // ✅ TODAY'S STUDY ANALYTICS
    @Query("SELECT COUNT(DISTINCT pr.student) FROM StudentFlashcardProgress pr " +
            "WHERE DATE(pr.lastReviewed) = CURRENT_DATE")
    long countActiveStudentsToday();

    @Query("SELECT COUNT(pr) FROM StudentFlashcardProgress pr " +
            "WHERE DATE(pr.lastReviewed) = CURRENT_DATE")
    long countReviewsToday();

    // ✅ DIFFICULTY RATING ANALYTICS
    @Query("SELECT pr.lastDifficultyRating, COUNT(pr) FROM StudentFlashcardProgress pr " +
            "WHERE pr.lastDifficultyRating IS NOT NULL " +
            "GROUP BY pr.lastDifficultyRating")
    List<Object[]> getDifficultyRatingStatistics();
}