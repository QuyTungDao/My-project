package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.CorrectAnswer;
import tungdao.com.project1.entity.Question;

import java.util.List;
import java.util.Optional;

@Repository
public interface CorrectAnswerRepository extends JpaRepository<CorrectAnswer, Integer> {

    CorrectAnswer findByQuestionId(Integer questionId);

    @Modifying
    @Query("DELETE FROM CorrectAnswer c WHERE c.question.id IN :questionIds")
    void deleteByQuestionIdIn(@Param("questionIds") List<Integer> questionIds);
}