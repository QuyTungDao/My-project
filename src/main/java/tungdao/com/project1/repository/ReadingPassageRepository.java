package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.ReadingPassage;
import tungdao.com.project1.entity.Test;

import java.util.List;

@Repository
public interface ReadingPassageRepository extends JpaRepository<ReadingPassage, Integer> {

    List<ReadingPassage> findByTest(Test test);

    List<ReadingPassage> findByTestIdOrderByOrderInTest(Integer testId);
}