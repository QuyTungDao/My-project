package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.Test;
import tungdao.com.project1.entity.TestAttempt;
import tungdao.com.project1.entity.User;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TestAttemptRepository extends JpaRepository<TestAttempt, Integer> {

    List<TestAttempt> findByStudentIdOrderByStartTimeDesc(Integer studentId);

    List<TestAttempt> findByTestIdOrderByStartTimeDesc(Integer testId);
    @Query("SELECT ta FROM TestAttempt ta LEFT JOIN FETCH ta.responses WHERE ta.id = :id")
    TestAttempt findByIdWithResponses(@Param("id") Integer id);
}