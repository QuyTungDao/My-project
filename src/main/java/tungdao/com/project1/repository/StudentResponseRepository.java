package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.Question;
import tungdao.com.project1.entity.StudentResponse;
import tungdao.com.project1.entity.TestAttempt;
import tungdao.com.project1.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentResponseRepository extends JpaRepository<StudentResponse, Integer> {

    List<StudentResponse> findByAttemptId(Integer attemptId);

    List<StudentResponse> findByStudentIdAndQuestionId(Integer studentId, Integer questionId);
}