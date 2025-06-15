package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.StudentProgress;
import tungdao.com.project1.entity.User;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProgressRepository extends JpaRepository<StudentProgress, Integer> {

    // Existing methods
    List<StudentProgress> findByStudent(User student);

    // ✅ FIX: Sử dụng enum thay vì String
    Optional<StudentProgress> findByStudentAndSkillType(User student, StudentProgress.SkillProgressType skillType);

    @Query("SELECT sp FROM StudentProgress sp WHERE sp.currentBandScore >= :minScore")
    List<StudentProgress> findStudentsWithScoreAbove(@Param("minScore") BigDecimal minScore);

    @Query("SELECT AVG(sp.improvementRate) FROM StudentProgress sp WHERE sp.skillType = :skillType")
    Optional<BigDecimal> calculateAverageImprovementRate(@Param("skillType") StudentProgress.SkillProgressType skillType);

    // ===== METHODS CHO FLASHCARDS =====

    // Top students theo study streak
    @Query("SELECT sp FROM StudentProgress sp WHERE sp.skillType = 'FLASHCARDS' " +
            "ORDER BY sp.currentStudyStreak DESC")
    List<StudentProgress> findTopStudentsByStreak();

    // Thống kê tổng quan flashcards
    @Query("SELECT SUM(sp.totalFlashcardsLearned), AVG(sp.currentStudyStreak), MAX(sp.longestStudyStreak) " +
            "FROM StudentProgress sp WHERE sp.skillType = 'FLASHCARDS'")
    Object[] getFlashcardStatistics();
}