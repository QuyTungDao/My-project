package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.TestScoreMapping;
import tungdao.com.project1.entity.TestScoreMappingType;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface TestScoreMappingRepository extends JpaRepository<TestScoreMapping, TestScoreMappingType> {

    @Query("SELECT m FROM TestScoreMapping m WHERE m.testType = :testType " +
            "AND :correctAnswers BETWEEN m.correctAnswersMin AND m.correctAnswersMax")
    TestScoreMapping findByTestTypeAndCorrectAnswersRange(
            @Param("testType") TestScoreMappingType testType,  // Thay đổi từ String sang TestScoreMappingType
            @Param("correctAnswers") Integer correctAnswers
    );}