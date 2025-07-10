package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.User;
import tungdao.com.project1.entity.UserRole;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(UserRole role);

    List<User> findByIsActiveTrue();

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") String role);

    List<User> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullName, String email);

    @Query("SELECT u FROM User u WHERE u.role = :role AND u.isActive = true")
    List<User> findActiveUsersByRole(@Param("role") String role);

    // ✅ ENHANCED: Count active users (users who are marked as active)
    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true")
    long countActiveUsers();

    // ✅ NEW: Count users who logged in recently (within last 30 days)
    @Query("SELECT COUNT(u) FROM User u WHERE u.lastLogin >= :since AND u.isActive = true")
    long countRecentlyActiveUsers(@Param("since") LocalDateTime since);

    // ✅ NEW: Count users created today
    @Query("SELECT COUNT(u) FROM User u WHERE DATE(u.createdAt) = CURRENT_DATE")
    long countUsersCreatedToday();

    // ✅ NEW: Count users created in the last N days
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :since")
    long countUsersCreatedSince(@Param("since") LocalDateTime since);

    // ✅ NEW: Count users by role
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.isActive = true")
    long countActiveUsersByRole(@Param("role") UserRole role);

    // ✅ NEW: Get user statistics for dashboard
    @Query("SELECT new map(" +
            "COUNT(u) as totalUsers, " +
            "COUNT(CASE WHEN u.isActive = true THEN 1 END) as activeUsers, " +
            "COUNT(CASE WHEN u.role = 'STUDENT' THEN 1 END) as students, " +
            "COUNT(CASE WHEN u.role = 'TEACHER' THEN 1 END) as teachers, " +
            "COUNT(CASE WHEN u.role = 'ADMIN' THEN 1 END) as admins" +
            ") FROM User u")
    List<Object> getUserStatistics();

    // ✅ NEW: Find recently registered users (for recent activity)
    @Query("SELECT u FROM User u WHERE u.createdAt >= :since ORDER BY u.createdAt DESC")
    List<User> findRecentlyRegisteredUsers(@Param("since") LocalDateTime since);

    // ✅ NEW: Get users with test attempts (for analytics)
    @Query("SELECT DISTINCT u FROM User u JOIN u.testAttempts ta WHERE u.isActive = true")
    List<User> findUsersWithTestAttempts();

    // ✅ NEW: Count users with test attempts
    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.testAttempts ta WHERE u.isActive = true")
    long countUsersWithTestAttempts();

    // ✅ NEW: Get top active users (by test attempts)
    @Query("SELECT u FROM User u JOIN u.testAttempts ta WHERE u.isActive = true " +
            "GROUP BY u ORDER BY COUNT(ta) DESC")
    List<User> findTopActiveUsers();

    // ✅ NEW: Find users who created flashcards
    @Query("SELECT DISTINCT u FROM User u JOIN u.flashcards f WHERE u.isActive = true")
    List<User> findUsersWithFlashcards();
}