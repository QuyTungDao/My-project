package tungdao.com.project1.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TestAttemptDTO {
    private Integer id;
    private Integer studentId;
    private String studentName;
    private Integer testId;
    private String testName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean isCompleted;
    private BigDecimal listeningScore;
    private BigDecimal readingScore;
    private BigDecimal writingScore;
    private BigDecimal speakingScore;
    private BigDecimal totalScore;
    private List<StudentResponseDTO> responses = new ArrayList<>();

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getStudentId() {
        return studentId;
    }

    public void setStudentId(Integer studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public Integer getTestId() {
        return testId;
    }

    public void setTestId(Integer testId) {
        this.testId = testId;
    }

    public String getTestName() {
        return testName;
    }

    public void setTestName(String testName) {
        this.testName = testName;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Boolean getIsCompleted() {
        return isCompleted;
    }

    public void setIsCompleted(Boolean completed) {
        isCompleted = completed;
    }

    public BigDecimal getListeningScore() {
        return listeningScore;
    }

    public void setListeningScore(BigDecimal listeningScore) {
        this.listeningScore = listeningScore;
    }

    public BigDecimal getReadingScore() {
        return readingScore;
    }

    public void setReadingScore(BigDecimal readingScore) {
        this.readingScore = readingScore;
    }

    public BigDecimal getWritingScore() {
        return writingScore;
    }

    public void setWritingScore(BigDecimal writingScore) {
        this.writingScore = writingScore;
    }

    public BigDecimal getSpeakingScore() {
        return speakingScore;
    }

    public void setSpeakingScore(BigDecimal speakingScore) {
        this.speakingScore = speakingScore;
    }

    public BigDecimal getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(BigDecimal totalScore) {
        this.totalScore = totalScore;
    }

    public List<StudentResponseDTO> getResponses() {
        return responses;
    }

    public void setResponses(List<StudentResponseDTO> responses) {
        this.responses = responses;
    }
}