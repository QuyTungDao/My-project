package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tungdao.com.project1.entity.Answer;

public interface AnswerRepository extends JpaRepository<Answer, Integer> {
}
