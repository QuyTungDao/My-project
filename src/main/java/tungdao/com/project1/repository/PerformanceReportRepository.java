package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.PerformanceReport;
import tungdao.com.project1.entity.Test;
import tungdao.com.project1.entity.TestAttempt;
import tungdao.com.project1.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceReportRepository extends JpaRepository<PerformanceReport, Integer> {

    List<PerformanceReport> findByStudent(User student);

    List<PerformanceReport> findByTest(Test test);

    Optional<PerformanceReport> findByAttempt(TestAttempt attempt);

    List<PerformanceReport> findByIsFinalTrue();

    @Query("SELECT pr FROM PerformanceReport pr WHERE pr.student = :student ORDER BY pr.generatedAt DESC")
    List<PerformanceReport> findLatestReportsByStudent(User student);
}