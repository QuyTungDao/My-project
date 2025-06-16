package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.User;
import tungdao.com.project1.entity.UserRole;

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

//    @Query("SELECT u FROM User u WHERE u.lastLogin >= CURRENT_DATE - 30 AND u.isActive = true")
//    List<User> findRecentlyActiveUsers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true")
    long countActiveUsers();

//    @Query("SELECT u FROM User u WHERE u.createdAt >= CURRENT_DATE - :days")
//    List<User> findUsersCreatedInLastDays(@Param("days") int days);
}
