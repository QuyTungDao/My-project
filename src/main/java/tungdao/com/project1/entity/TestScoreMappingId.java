package tungdao.com.project1.entity;

import java.util.Objects;

public class TestScoreMappingId implements java.io.Serializable {
    private TestScoreMapping.TestType testType;
    private Integer correctAnswersMin;
    private Integer correctAnswersMax;

    // Constructor mặc định
    public TestScoreMappingId() {}

    // Constructor có tham số
    public TestScoreMappingId(TestScoreMapping.TestType testType, Integer correctAnswersMin, Integer correctAnswersMax) {
        this.testType = testType;
        this.correctAnswersMin = correctAnswersMin;
        this.correctAnswersMax = correctAnswersMax;
    }

    // Getters và Setters
    public TestScoreMapping.TestType getTestType() {
        return testType;
    }

    public void setTestType(TestScoreMapping.TestType testType) {
        this.testType = testType;
    }

    public Integer getCorrectAnswersMin() {
        return correctAnswersMin;
    }

    public void setCorrectAnswersMin(Integer correctAnswersMin) {
        this.correctAnswersMin = correctAnswersMin;
    }

    public Integer getCorrectAnswersMax() {
        return correctAnswersMax;
    }

    public void setCorrectAnswersMax(Integer correctAnswersMax) {
        this.correctAnswersMax = correctAnswersMax;
    }

    // Override equals
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TestScoreMappingId that = (TestScoreMappingId) o;
        return testType == that.testType &&
                correctAnswersMin.equals(that.correctAnswersMin) &&
                correctAnswersMax.equals(that.correctAnswersMax);
    }

    // Override hashCode
    @Override
    public int hashCode() {
        return Objects.hash(testType, correctAnswersMin, correctAnswersMax);
    }
}
