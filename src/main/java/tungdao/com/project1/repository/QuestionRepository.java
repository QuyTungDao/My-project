package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tungdao.com.project1.entity.Question;

public interface QuestionRepository extends JpaRepository<Question, Integer> {
}
