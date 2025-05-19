package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.*;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Integer> {

    List<Question> findByTestIdOrderByOrderInTest(Integer testId);

    List<Question> findByPassageIdOrderByOrderInTest(Integer passageId);

    List<Question> findByAudioIdOrderByOrderInTest(Integer audioId);
}