package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.StudentProgress;
import tungdao.com.project1.entity.User;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProgressRepository extends JpaRepository<StudentProgress, Integer> {

    List<StudentProgress> findByStudent(User student);

    Optional<StudentProgress> findByStudentAndSkillType(User student, String skillType);

    @Query("SELECT sp FROM StudentProgress sp WHERE sp.currentBandScore >= :minScore")
    List<StudentProgress> findStudentsWithScoreAbove(BigDecimal minScore);

    @Query("SELECT AVG(sp.improvementRate) FROM StudentProgress sp WHERE sp.skillType = :skillType")
    Optional<BigDecimal> calculateAverageImprovementRate(String skillType);
}