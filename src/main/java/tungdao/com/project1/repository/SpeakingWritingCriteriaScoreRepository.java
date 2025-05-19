package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.SpeakingWritingCriteriaScore;
import tungdao.com.project1.entity.StudentResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpeakingWritingCriteriaScoreRepository extends JpaRepository<SpeakingWritingCriteriaScore, Integer> {

    Optional<SpeakingWritingCriteriaScore> findByResponse(StudentResponse response);

    @Query("SELECT AVG(swcs.taskAchievement) FROM SpeakingWritingCriteriaScore swcs JOIN swcs.response sr JOIN sr.attempt a WHERE a.id = :attemptId")
    Optional<BigDecimal> calculateAverageTaskAchievement(Integer attemptId);

    @Query("SELECT AVG(swcs.coherenceCohesion) FROM SpeakingWritingCriteriaScore swcs JOIN swcs.response sr JOIN sr.attempt a WHERE a.id = :attemptId")
    Optional<BigDecimal> calculateAverageCoherenceCohesion(Integer attemptId);

    @Query("SELECT AVG(swcs.lexicalResource) FROM SpeakingWritingCriteriaScore swcs JOIN swcs.response sr JOIN sr.attempt a WHERE a.id = :attemptId")
    Optional<BigDecimal> calculateAverageLexicalResource(Integer attemptId);

    @Query("SELECT AVG(swcs.grammaticalAccuracy) FROM SpeakingWritingCriteriaScore swcs JOIN swcs.response sr JOIN sr.attempt a WHERE a.id = :attemptId")
    Optional<BigDecimal> calculateAverageGrammaticalAccuracy(Integer attemptId);
}