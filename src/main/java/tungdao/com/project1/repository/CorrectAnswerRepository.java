package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.CorrectAnswer;
import tungdao.com.project1.entity.Question;

import java.util.Optional;

@Repository
public interface CorrectAnswerRepository extends JpaRepository<CorrectAnswer, Integer> {

    CorrectAnswer findByQuestionId(Integer questionId);
}