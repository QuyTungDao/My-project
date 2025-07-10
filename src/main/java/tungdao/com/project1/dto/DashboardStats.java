// src/main/java/tungdao/com/project1/dto/DashboardStats.java
package tungdao.com.project1.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalUsers;
    private long totalTests;
    private long totalFlashcards;
    private long activeUsers;

    // Growth rates (optional - calculated on frontend or backend)
    private double userGrowthRate;
    private double testGrowthRate;
    private double flashcardGrowthRate;
    private double activeUserGrowthRate;

    // Additional statistics
    private long publishedTests;
    private long draftTests;
    private long totalTestAttempts;
    private long todayVisits;
    private long onlineUsers;

    // Constructor with basic stats only
    public DashboardStats(long totalUsers, long totalTests, long totalFlashcards, long activeUsers) {
        this.totalUsers = totalUsers;
        this.totalTests = totalTests;
        this.totalFlashcards = totalFlashcards;
        this.activeUsers = activeUsers;

        // Default values for optional fields
        this.userGrowthRate = 0.0;
        this.testGrowthRate = 0.0;
        this.flashcardGrowthRate = 0.0;
        this.activeUserGrowthRate = 0.0;
        this.publishedTests = 0;
        this.draftTests = 0;
        this.totalTestAttempts = 0;
        this.todayVisits = 0;
        this.onlineUsers = 0;
    }
}