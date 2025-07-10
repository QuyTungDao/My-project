package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.Question;
import tungdao.com.project1.entity.StudentResponse;
import tungdao.com.project1.entity.TestAttempt;
import tungdao.com.project1.entity.User;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface StudentResponseRepository extends JpaRepository<StudentResponse, Integer> {

    // ✅ EXISTING METHODS (keep as is)
    List<StudentResponse> findByAttemptId(Integer attemptId);

    List<StudentResponse> findByStudentIdAndQuestionId(Integer studentId, Integer questionId);

    @Modifying
    @Query("DELETE FROM StudentResponse sr WHERE sr.question.id IN :questionIds")
    void deleteByQuestionIdIn(@Param("questionIds") List<Integer> questionIds);

    // ✅ NEW METHODS FOR GRADING SYSTEM

    /**
     * Find responses by attempt ID ordered by question order
     */
    @Query("SELECT sr FROM StudentResponse sr " +
            "JOIN FETCH sr.question q " +
            "WHERE sr.attempt.id = :attemptId " +
            "ORDER BY q.orderInTest ASC, sr.id ASC")
    List<StudentResponse> findByAttemptIdOrderByQuestionOrder(@Param("attemptId") Integer attemptId);

    @Query("SELECT COUNT(sr) FROM StudentResponse sr WHERE sr.attempt.id = :attemptId")
    long countResponsesByAttemptId(@Param("attemptId") Integer attemptId);

    /**
     * Check if attempt has any responses - SAFE
     */
    @Query("SELECT CASE WHEN COUNT(sr) > 0 THEN true ELSE false END " +
            "FROM StudentResponse sr WHERE sr.attempt.id = :attemptId")
    boolean hasResponsesForAttempt(@Param("attemptId") Integer attemptId);

    /**
     * Find responses that need manual grading by teacher
     */
    @Query("SELECT sr FROM StudentResponse sr " +
            "WHERE sr.manualScore IS NULL " +
            "AND sr.attempt.test.creator.id = :teacherId " +
            "AND (sr.audioBase64 IS NOT NULL OR " +
            "(sr.responseText IS NOT NULL AND sr.question.questionType IN " +
            "('ESSAY', 'WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', " +
            "'SPEAKING_TASK', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3')))")
    List<StudentResponse> findPendingGradingByTeacher(@Param("teacherId") Integer teacherId);

    /**
     * Find responses that need manual grading for a specific test
     */
    @Query("SELECT sr FROM StudentResponse sr " +
            "WHERE sr.manualScore IS NULL " +
            "AND sr.attempt.test.id = :testId " +
            "AND (sr.audioBase64 IS NOT NULL OR " +
            "(sr.responseText IS NOT NULL AND sr.question.questionType IN " +
            "('ESSAY', 'WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', " +
            "'SPEAKING_TASK', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3')))")
    List<StudentResponse> findPendingGradingByTestId(@Param("testId") Integer testId);

    /**
     * Count responses needing grading by teacher
     */
    @Query("SELECT COUNT(sr) FROM StudentResponse sr " +
            "WHERE sr.manualScore IS NULL " +
            "AND sr.attempt.test.creator.id = :teacherId " +
            "AND (sr.audioBase64 IS NOT NULL OR " +
            "(sr.responseText IS NOT NULL AND sr.question.questionType IN " +
            "('ESSAY', 'WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', " +
            "'SPEAKING_TASK', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3')))")
    Long countPendingGradingByTeacher(@Param("teacherId") Integer teacherId);

    /**
     * Find responses graded by a specific grader
     */
    @Query("SELECT sr FROM StudentResponse sr WHERE sr.grader.id = :graderId ORDER BY sr.feedbackGivenAt DESC")
    List<StudentResponse> findByGraderId(@Param("graderId") Integer graderId);

    /**
     * Find responses for a specific question
     */
    List<StudentResponse> findByQuestionId(Integer questionId);

    /**
     * Find responses with audio data
     */
    @Query("SELECT sr FROM StudentResponse sr WHERE sr.audioBase64 IS NOT NULL AND LENGTH(sr.audioBase64) > 0")
    List<StudentResponse> findResponsesWithAudio();

    /**
     * Find responses by attempt and response type
     */
    @Query("SELECT sr FROM StudentResponse sr WHERE sr.attempt.id = :attemptId AND sr.responseType = :responseType")
    List<StudentResponse> findByAttemptIdAndResponseType(@Param("attemptId") Integer attemptId,
                                                         @Param("responseType") String responseType);

    /**
     * Get average manual score for a test
     */
    @Query("SELECT AVG(sr.manualScore) FROM StudentResponse sr " +
            "WHERE sr.attempt.test.id = :testId AND sr.manualScore IS NOT NULL")
    Double getAverageManualScoreForTest(@Param("testId") Integer testId);

    /**
     * Get average manual score for tests created by teacher
     */
    @Query("SELECT AVG(sr.manualScore) FROM StudentResponse sr " +
            "WHERE sr.attempt.test.creator.id = :teacherId AND sr.manualScore IS NOT NULL")
    Double getAverageManualScoreForTeacher(@Param("teacherId") Integer teacherId);

    /**
     * Find latest responses by student for grading history
     */
    @Query("SELECT sr FROM StudentResponse sr " +
            "WHERE sr.student.id = :studentId " +
            "AND sr.manualScore IS NOT NULL " +
            "ORDER BY sr.feedbackGivenAt DESC")
    List<StudentResponse> findGradedResponsesByStudent(@Param("studentId") Integer studentId);

    /**
     * Find responses that require manual grading (audio or subjective text)
     */
    @Query("SELECT sr FROM StudentResponse sr " +
            "JOIN sr.question q " +
            "WHERE (sr.audioBase64 IS NOT NULL " +
            "OR q.questionType IN ('ESSAY', 'WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', " +
            "'SPEAKING_TASK', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3')) " +
            "AND sr.manualScore IS NULL " +
            "ORDER BY sr.submittedAt DESC")
    List<StudentResponse> findAllPendingManualGrading();

    /**
     * Check if all responses in an attempt are graded
     */
    @Query("SELECT COUNT(sr) FROM StudentResponse sr " +
            "JOIN sr.question q " +
            "WHERE sr.attempt.id = :attemptId " +
            "AND (sr.audioBase64 IS NOT NULL " +
            "OR q.questionType IN ('ESSAY', 'WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', " +
            "'SPEAKING_TASK', 'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3')) " +
            "AND sr.manualScore IS NULL")
    Long countUngraduatedResponsesInAttempt(@Param("attemptId") Integer attemptId);

    /**
     * Find responses with feedback
     */
    @Query("SELECT sr FROM StudentResponse sr " +
            "WHERE sr.feedback IS NOT NULL AND LENGTH(TRIM(sr.feedback)) > 0 " +
            "ORDER BY sr.feedbackGivenAt DESC")
    List<StudentResponse> findResponsesWithFeedback();

    @Query("SELECT COUNT(sr) FROM StudentResponse sr WHERE sr.attempt.id = :attemptId")
    int countByAttemptId(@Param("attemptId") Integer attemptId);

    /**
     * Count responses that require manual grading for an attempt
     */
    @Query("SELECT COUNT(sr) FROM StudentResponse sr " +
            "JOIN sr.question q " +
            "WHERE sr.attempt.id = :attemptId " +
            "AND (q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', " +
            "'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') " +
            "OR sr.audioBase64 IS NOT NULL)")
    int countManualGradingRequiredByAttemptId(@Param("attemptId") Integer attemptId);

    /**
     * Count responses that have been manually graded for an attempt
     */
    @Query("SELECT COUNT(sr) FROM StudentResponse sr " +
            "JOIN sr.question q " +
            "WHERE sr.attempt.id = :attemptId " +
            "AND (q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', " +
            "'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') " +
            "OR sr.audioBase64 IS NOT NULL) " +
            "AND sr.manualScore IS NOT NULL")
    int countGradedManualResponsesByAttemptId(@Param("attemptId") Integer attemptId);

    /**
     * Check if response requires manual grading
     */
    @Query("SELECT CASE WHEN COUNT(sr) > 0 THEN true ELSE false END " +
            "FROM StudentResponse sr " +
            "JOIN sr.question q " +
            "WHERE sr.id = :responseId " +
            "AND (q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', " +
            "'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') " +
            "OR sr.audioBase64 IS NOT NULL)")
    boolean requiresManualGrading(@Param("responseId") Integer responseId);

    /**
     * Get responses that need manual grading for a test
     */
    @Query("SELECT sr FROM StudentResponse sr " +
            "JOIN sr.question q " +
            "JOIN sr.attempt ta " +
            "WHERE ta.test.id = :testId " +
            "AND (q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', " +
            "'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') " +
            "OR sr.audioBase64 IS NOT NULL) " +
            "AND sr.manualScore IS NULL " +
            "ORDER BY ta.endTime DESC, sr.id ASC")
    List<StudentResponse> findPendingManualGradingByTestId(@Param("testId") Integer testId);

    /**
     * Get attempt statistics for grading
     */
    @Query("SELECT new map(" +
            "COUNT(sr) as totalResponses, " +
            "COUNT(CASE WHEN q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', " +
            "'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') OR sr.audioBase64 IS NOT NULL THEN 1 END) as manualRequired, " +
            "COUNT(CASE WHEN (q.questionType IN ('WRITING_TASK1_ACADEMIC', 'WRITING_TASK1_GENERAL', 'WRITING_TASK2', 'ESSAY', " +
            "'SPEAKING_PART1', 'SPEAKING_PART2', 'SPEAKING_PART3', 'SPEAKING_TASK') OR sr.audioBase64 IS NOT NULL) " +
            "AND sr.manualScore IS NOT NULL THEN 1 END) as manualGraded" +
            ") " +
            "FROM StudentResponse sr " +
            "JOIN sr.question q " +
            "WHERE sr.attempt.id = :attemptId")
    Map<String, Long> getAttemptGradingStatistics(@Param("attemptId") Integer attemptId);
}