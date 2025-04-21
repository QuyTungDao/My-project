package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tungdao.com.project1.entity.PerformanceReport;

public interface PerformanceReportRepository extends JpaRepository<PerformanceReport, Integer> {
}
