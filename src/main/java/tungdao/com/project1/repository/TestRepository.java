package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.Test;
import tungdao.com.project1.entity.TestType;
import tungdao.com.project1.entity.User;

import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Integer> {

    @Query("SELECT t FROM Test t WHERE t.isPublished = true")
    List<Test> findByIsPublishedTrue();

    List<Test> findByTestNameContainingAndIsPublishedTrue(String query);

    List<Test> findByTestTypeAndIsPublishedTrue(String testType);

}