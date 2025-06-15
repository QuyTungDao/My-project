package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.FlashCard;
import tungdao.com.project1.entity.StudentFlashcardProgress;
import tungdao.com.project1.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentFlashcardProgressRepository extends JpaRepository<StudentFlashcardProgress, Integer> {

    List<StudentFlashcardProgress> findByStudent(User student);

    List<StudentFlashcardProgress> findByFlashcard(FlashCard flashcard);

    Optional<StudentFlashcardProgress> findByStudentAndFlashcard(User student, FlashCard flashcard);

    @Query("SELECT sfp FROM StudentFlashcardProgress sfp WHERE sfp.student = :student AND sfp.nextReviewDate <= :now")
    List<StudentFlashcardProgress> findDueFlashcards(User student, LocalDateTime now);

    @Query("SELECT sfp FROM StudentFlashcardProgress sfp WHERE sfp.student = :student " +
            "AND DATE(sfp.nextReviewDate) <= CURRENT_DATE ORDER BY sfp.nextReviewDate")
    List<StudentFlashcardProgress> findTodayReviewCards(@Param("student") User student);

    // Tìm theo mastery level
    List<StudentFlashcardProgress> findByStudentAndMasteryLevel(
            User student, StudentFlashcardProgress.MasteryLevel masteryLevel);

    // Đếm thẻ theo từng level
    @Query("SELECT sfp.masteryLevel, COUNT(sfp) FROM StudentFlashcardProgress sfp " +
            "WHERE sfp.student = :student GROUP BY sfp.masteryLevel")
    List<Object[]> countCardsByMasteryLevel(@Param("student") User student);

    // Tính accuracy
    @Query("SELECT AVG(CASE WHEN sfp.lastDifficultyRating IN ('EASY', 'MEDIUM') THEN 1.0 ELSE 0.0 END) " +
            "FROM StudentFlashcardProgress sfp WHERE sfp.student = :student AND sfp.totalReviews > 0")
    Optional<Double> calculateAccuracy(@Param("student") User student);

    // Lấy thống kê học tập trong X ngày
    @Query("SELECT COUNT(sfp) FROM StudentFlashcardProgress sfp " +
            "WHERE sfp.student = :student AND sfp.lastReviewed >= :since")
    Long countReviewsSince(@Param("student") User student, @Param("since") LocalDateTime since);
}