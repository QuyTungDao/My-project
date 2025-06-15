package tungdao.com.project1.repository;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.*;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Integer> {

    List<Question> findByTestIdOrderByOrderInTest(Integer testId);

    List<Question> findByPassageIdOrderByOrderInTest(Integer passageId);

    List<Question> findByAudioIdOrderByOrderInTest(Integer audioId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Question q WHERE q.test.id = :testId")
    void deleteByTestId(@Param("testId") Integer testId);

    @Query("SELECT q.id FROM Question q WHERE q.test.id = :testId")
    List<Integer> findQuestionIdsByTestId(@Param("testId") Integer testId);

    // ✅ ADD: Count questions by test
    @Query("SELECT COUNT(q) FROM Question q WHERE q.test.id = :testId")
    Long countByTestId(@Param("testId") Integer testId);

    // ✅ ADD: Get questions with specific answer status
    @Query("SELECT q FROM Question q WHERE q.test.id = :testId AND q.id IN :answeredQuestionIds ORDER BY q.orderInTest ASC")
    List<Question> findAnsweredQuestionsByTestId(@Param("testId") Integer testId, @Param("answeredQuestionIds") List<Integer> answeredQuestionIds);
}