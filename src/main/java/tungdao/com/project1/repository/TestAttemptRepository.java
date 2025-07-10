package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.StudentResponse;
import tungdao.com.project1.entity.Test;
import tungdao.com.project1.entity.TestAttempt;
import tungdao.com.project1.entity.User;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TestAttemptRepository extends JpaRepository<TestAttempt, Integer> {

    // ✅ EXISTING METHODS (keep as is)
    List<TestAttempt> findByStudentIdOrderByStartTimeDesc(Integer studentId);

    List<TestAttempt> findByTestIdOrderByStartTimeDesc(Integer testId);

    @Query("SELECT ta FROM TestAttempt ta LEFT JOIN FETCH ta.responses WHERE ta.id = :id")
    TestAttempt findByIdWithResponses(@Param("id") Integer id);

    @Modifying
    @Query("DELETE FROM TestAttempt a WHERE a.test.id = :testId")
    void deleteByTestId(@Param("testId") Integer testId);

    // ✅ NEW METHODS FOR ROLE-BASED STATISTICS:

    /**
     * Count attempts by test creator (for teacher statistics)
     */
    @Query("SELECT COUNT(ta) FROM TestAttempt ta WHERE ta.test.creator = :creator")
    Long countByTestCreator(@Param("creator") User creator);

    /**
     * Count attempts by student ID
     */
    @Query("SELECT COUNT(ta) FROM TestAttempt ta WHERE ta.student.id = :studentId")
    Long countByStudentId(@Param("studentId") Integer studentId);

    /**
     * Count completed attempts by student ID
     */
    @Query("SELECT COUNT(ta) FROM TestAttempt ta WHERE ta.student.id = :studentId AND ta.isCompleted = true")
    Long countByStudentIdAndIsCompletedTrue(@Param("studentId") Integer studentId);

    /**
     * Count attempts for a specific test
     */
    @Query("SELECT COUNT(ta) FROM TestAttempt ta WHERE ta.test.id = :testId")
    Long countByTestId(@Param("testId") Integer testId);

    /**
     * Get attempts for tests created by specific user (for teacher to see all attempts on their tests)
     */
    @Query("SELECT ta FROM TestAttempt ta WHERE ta.test.creator = :creator ORDER BY ta.startTime DESC")
    List<TestAttempt> findByTestCreatorOrderByStartTimeDesc(@Param("creator") User creator);

    /**
     * Get recent attempts (last 7 days for dashboard)
     */
    @Query("SELECT ta FROM TestAttempt ta WHERE ta.startTime >= :sinceDate ORDER BY ta.startTime DESC")
    List<TestAttempt> findRecentAttempts(@Param("sinceDate") LocalDateTime sinceDate);

    /**
     * Find attempts that need grading (have null scores for writing/speaking)
     */
    @Query("SELECT ta FROM TestAttempt ta " +
            "JOIN ta.responses sr " +
            "JOIN sr.question q " +
            "WHERE q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') " +
            "AND sr.isCorrect IS NULL " +
            "GROUP BY ta.id " +
            "ORDER BY ta.startTime DESC")
    List<TestAttempt> findAttemptsNeedingGrading();

    /**
     * Find attempts for a specific test that need grading
     */
    @Query("SELECT ta FROM TestAttempt ta " +
            "JOIN ta.responses sr " +
            "JOIN sr.question q " +
            "WHERE ta.test.id = :testId " +
            "AND q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') " +
            "AND sr.isCorrect IS NULL " +
            "GROUP BY ta.id " +
            "ORDER BY ta.startTime DESC")
    List<TestAttempt> findAttemptsNeedingGradingForTest(@Param("testId") Integer testId);

    /**
     * Find attempts for tests created by specific teacher that need grading
     */
    @Query("SELECT ta FROM TestAttempt ta " +
            "JOIN ta.responses sr " +
            "JOIN sr.question q " +
            "WHERE ta.test.creator = :creator " +
            "AND q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') " +
            "AND sr.isCorrect IS NULL " +
            "GROUP BY ta.id " +
            "ORDER BY ta.startTime DESC")
    List<TestAttempt> findAttemptsNeedingGradingByCreator(@Param("creator") User creator);

    /**
     * Count attempts needing grading for a teacher
     */
    @Query("SELECT COUNT(DISTINCT ta.id) FROM TestAttempt ta " +
            "JOIN ta.responses sr " +
            "JOIN sr.question q " +
            "WHERE ta.test.creator = :creator " +
            "AND q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') " +
            "AND sr.isCorrect IS NULL")
    Long countAttemptsNeedingGradingByCreator(@Param("creator") User creator);

    /**
     * Find attempts by student for a specific test
     */
    @Query("SELECT ta FROM TestAttempt ta WHERE ta.student.id = :studentId AND ta.test.id = :testId ORDER BY ta.startTime DESC")
    List<TestAttempt> findByStudentIdAndTestId(@Param("studentId") Integer studentId, @Param("testId") Integer testId);

    /**
     * Find user's latest attempt for each test
     */
    @Query("SELECT ta FROM TestAttempt ta WHERE ta.student.id = :studentId " +
            "AND ta.startTime = (SELECT MAX(ta2.startTime) FROM TestAttempt ta2 WHERE ta2.student.id = :studentId AND ta2.test.id = ta.test.id) " +
            "ORDER BY ta.startTime DESC")
    List<TestAttempt> findLatestAttemptsByStudent(@Param("studentId") Integer studentId);

    /**
     * Find high scoring attempts (for achievements/leaderboard)
     */
    @Query("SELECT ta FROM TestAttempt ta WHERE ta.totalScore >= :minScore ORDER BY ta.totalScore DESC, ta.startTime DESC")
    List<TestAttempt> findHighScoringAttempts(@Param("minScore") Double minScore);

    /**
     * Average score for a test
     */
    @Query("SELECT AVG(ta.totalScore) FROM TestAttempt ta WHERE ta.test.id = :testId AND ta.totalScore IS NOT NULL")
    Double getAverageScoreForTest(@Param("testId") Integer testId);

    /**
     * Average score for tests created by a teacher
     */
    @Query("SELECT AVG(ta.totalScore) FROM TestAttempt ta WHERE ta.test.creator = :creator AND ta.totalScore IS NOT NULL")
    Double getAverageScoreForTeacherTests(@Param("creator") User creator);

    @Query("SELECT DISTINCT ta FROM TestAttempt ta " +
            "LEFT JOIN FETCH ta.responses r " +
            "LEFT JOIN FETCH r.question " +
            "WHERE ta.student.id = :studentId " +
            "ORDER BY ta.startTime DESC")
    List<TestAttempt> findByStudentIdWithResponsesOrderByStartTimeDesc(@Param("studentId") Integer studentId);

    @Query("SELECT sr FROM StudentResponse sr WHERE sr.attempt.id = :attemptId ORDER BY sr.question.orderInTest")
    List<StudentResponse> findByAttemptIdOrderByQuestionOrder(@Param("attemptId") Integer attemptId);

    @Query("SELECT sr FROM StudentResponse sr WHERE sr.manualScore IS NULL AND sr.attempt.test.creator.id = :teacherId AND (sr.audioBase64 IS NOT NULL OR (sr.responseText IS NOT NULL AND sr.question.questionType IN ('ESSAY', 'WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'SPEAKING_TASK', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3')))")
    List<StudentResponse> findPendingGradingByTeacher(@Param("teacherId") Integer teacherId);

    List<TestAttempt> findByTestIdOrderByEndTimeDesc(Integer testId);
}