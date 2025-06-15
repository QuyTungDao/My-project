package tungdao.com.project1.repository;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.ListeningAudio;
import tungdao.com.project1.entity.ListeningSection;
import tungdao.com.project1.entity.Test;

import java.util.List;

@Repository
public interface ListeningAudioRepository extends JpaRepository<ListeningAudio, Integer> {

    List<ListeningAudio> findByTest(Test test);

    List<ListeningAudio> findByTestOrderByOrderInTest(Test testId);

    List<ListeningAudio> findBySection(ListeningSection section);

    @Modifying
    @Transactional
    @Query("DELETE FROM ListeningAudio a WHERE a.test.id = :testId")
    void deleteByTestId(@Param("testId") Integer testId);
}