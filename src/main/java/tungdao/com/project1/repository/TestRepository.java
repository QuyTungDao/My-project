package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tungdao.com.project1.entity.Test;

public interface TestRepository extends JpaRepository<Test, Integer> {
}
