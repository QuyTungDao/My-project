package tungdao.com.project1.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tungdao.com.project1.entity.User;
import tungdao.com.project1.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public User save(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User findById(Integer userId) {
        return userRepository.findById(userId).orElse(null);
    }

    /**
     * Update user information (without encoding password)
     */
    public User updateUser(User user) {
        // Don't encode password if it's not being changed
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    /**
     * Update user password
     */
    public User updatePassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    /**
     * Get all users (Admin function)
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Get active users only
     */
    public List<User> getActiveUsers() {
        return userRepository.findByIsActiveTrue();
    }

    /**
     * Soft delete user (set isActive = false)
     */
    public User deactivateUser(Integer userId) {
        User user = findById(userId);
        if (user != null) {
            user.setIsActive(false);
            user.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(user);
        }
        return null;
    }

    /**
     * Reactivate user
     */
    public User reactivateUser(Integer userId) {
        User user = findById(userId);
        if (user != null) {
            user.setIsActive(true);
            user.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(user);
        }
        return null;
    }

    /**
     * Update last login time
     */
    public void updateLastLogin(Integer userId) {
        User user = findById(userId);
        if (user != null) {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    /**
     * Check if user exists by email
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * Get user count by role
     */
    public long countUsersByRole(String role) {
        // This would need a custom repository method
        return userRepository.countByRole(role);
    }

    /**
     * Search users by name or email
     */
    public List<User> searchUsers(String searchTerm) {
        return userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                searchTerm, searchTerm);
    }

    public void deleteUserById(int id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public void deactivateUserById(int id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        u.setIsActive(false);
        // JPA tự động save khi transaction commit
    }

    public List<User> getAllActiveUsers() {
        return userRepository.findByIsActiveTrue();
    }
}

