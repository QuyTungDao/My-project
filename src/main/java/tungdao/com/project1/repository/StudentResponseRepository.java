package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tungdao.com.project1.entity.StudentResponses;

public interface StudentResponseRepository extends JpaRepository<StudentResponses, Integer> {
}
