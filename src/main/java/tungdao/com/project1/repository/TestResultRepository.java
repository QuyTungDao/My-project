package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tungdao.com.project1.entity.TestResult;

public interface TestResultRepository extends JpaRepository<TestResult, Integer> {
}
