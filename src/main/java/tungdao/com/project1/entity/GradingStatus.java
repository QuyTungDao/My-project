package tungdao.com.project1.entity;

import lombok.Getter;

@Getter
public enum GradingStatus {
    PENDING("PENDING", "Đang chờ chấm điểm"),
    COMPLETED("COMPLETED", "Đã hoàn thành chấm điểm");

    private final String code;
    private final String description;

    GradingStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    @Override
    public String toString() {
        return this.code;
    }
}