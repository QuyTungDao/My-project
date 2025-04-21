package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tungdao.com.project1.entity.TestScoreMapping;

public interface TestScoreMappingRepository extends JpaRepository<TestScoreMapping, TestScoreMapping.TestType> {
}
