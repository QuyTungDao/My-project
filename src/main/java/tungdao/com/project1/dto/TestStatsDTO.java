package tungdao.com.project1.dto;

import lombok.Data;

@Data
public class TestStatsDTO {
    private Integer totalTests;
    private Double averageScore;
    private String strongestSkill;
    private String weakestSkill;
    private Integer studyStreak;
    private Double totalStudyHours;
}