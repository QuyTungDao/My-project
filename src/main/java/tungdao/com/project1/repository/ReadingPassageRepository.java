package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.ReadingPassage;
import tungdao.com.project1.entity.Test;

import java.util.List;

@Repository
public interface ReadingPassageRepository extends JpaRepository<ReadingPassage, Integer> {

    List<ReadingPassage> findByTest(Test test);

    List<ReadingPassage> findByTestIdOrderByOrderInTest(Integer testId);

    @Modifying
    @Query("DELETE FROM ReadingPassage p WHERE p.test.id = :testId")
    void deleteByTestId(@Param("testId") Integer testId);
}