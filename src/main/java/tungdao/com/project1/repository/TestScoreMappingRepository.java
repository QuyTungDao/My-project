package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.TestScoreMapping;
import tungdao.com.project1.entity.TestScoreMappingType;

@Repository
public interface TestScoreMappingRepository extends JpaRepository<TestScoreMapping, TestScoreMappingType> {

    @Query("SELECT tsm FROM TestScoreMapping tsm WHERE tsm.testType = :testType " +
            "AND :correctAnswers >= tsm.correctAnswersMin " +
            "AND :correctAnswers <= tsm.correctAnswersMax")
    TestScoreMapping findByTestTypeAndCorrectAnswersRange(
            @Param("testType") TestScoreMappingType testType,
            @Param("correctAnswers") Integer correctAnswers);
}