package tungdao.com.project1.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tungdao.com.project1.entity.User;
import tungdao.com.project1.service.UserService;
import tungdao.com.project1.service.TestAttemptService;
import tungdao.com.project1.service.FlashcardService;
import tungdao.com.project1.dto.UserProfileDTO;
import tungdao.com.project1.dto.UserStatsDTO;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping(value = "/api/users", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final TestAttemptService testAttemptService;
    private final FlashcardService flashcardService;

    // ===== PROFILE ENDPOINTS =====

    /**
     * Get current user profile information
     */
    @GetMapping(value = "/profile", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getCurrentUserProfile(Authentication authentication) {
        try {
            User user = extractUserFromAuthentication(authentication);

            // Create profile DTO
            UserProfileDTO profile = new UserProfileDTO();
            profile.setId(user.getId());
            profile.setFullName(user.getFullName());
            profile.setEmail(user.getEmail());
            profile.setRole(user.getRole().toString());
            profile.setCreatedAt(user.getCreatedAt());
            profile.setLastLogin(user.getLastLogin());
            profile.setProfilePicture(user.getProfilePicture());
            profile.setIsActive(user.getIsActive());

            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            System.out.println("❌ Error getting user profile: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Internal server error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get comprehensive user statistics
     */
    @GetMapping(value = "/profile/stats", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getUserStatistics(Authentication authentication) {
        try {
            User user = extractUserFromAuthentication(authentication);

            // Get statistics from various services
            UserStatsDTO stats = new UserStatsDTO();

            // Test statistics
            try {
                var testStats = testAttemptService.getUserTestStatistics(user);
                stats.setTestStats(testStats);
            } catch (Exception e) {
                System.out.println("⚠️ Could not get test stats: " + e.getMessage());
                stats.setTestStats(createEmptyTestStats());
            }

            // Flashcard statistics
            try {
                var flashcardStats = flashcardService.getStudentStatistics(user);
                stats.setFlashcardStats(flashcardStats);
            } catch (Exception e) {
                System.out.println("⚠️ Could not get flashcard stats: " + e.getMessage());
                stats.setFlashcardStats(null);
            }

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.out.println("❌ Error getting user statistics: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Internal server error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Update user profile
     */
    @PutMapping(value = "/profile", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateUserProfile(
            @RequestBody UserProfileUpdateRequest request,
            Authentication authentication) {
        try {
            User user = extractUserFromAuthentication(authentication);

            // Update allowed fields
            if (request.getFullName() != null) {
                user.setFullName(request.getFullName());
            }

            if (request.getProfilePicture() != null) {
                user.setProfilePicture(request.getProfilePicture());
            }

            // Save updated user
            User updatedUser = userService.updateUser(user);

            // Return updated profile
            UserProfileDTO profile = new UserProfileDTO();
            profile.setId(updatedUser.getId());
            profile.setFullName(updatedUser.getFullName());
            profile.setEmail(updatedUser.getEmail());
            profile.setRole(updatedUser.getRole().toString());
            profile.setCreatedAt(updatedUser.getCreatedAt());
            profile.setLastLogin(updatedUser.getLastLogin());
            profile.setProfilePicture(updatedUser.getProfilePicture());
            profile.setIsActive(updatedUser.getIsActive());

            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            System.out.println("❌ Error updating user profile: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Internal server error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get user by ID (Admin only)
     */
    @GetMapping(value = "/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getUserById(@PathVariable Integer userId, Authentication authentication) {
        try {
            User currentUser = extractUserFromAuthentication(authentication);

            // Check if user is admin or getting their own profile
            if (!isAdmin(currentUser) && !currentUser.getId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of(
                        "error", "Forbidden",
                        "message", "You can only access your own profile"
                ));
            }

            User user = userService.findById(userId);
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of(
                        "error", "Not found",
                        "message", "User not found"
                ));
            }

            UserProfileDTO profile = new UserProfileDTO();
            profile.setId(user.getId());
            profile.setFullName(user.getFullName());
            profile.setEmail(user.getEmail());
            profile.setRole(user.getRole().toString());
            profile.setCreatedAt(user.getCreatedAt());
            profile.setLastLogin(user.getLastLogin());
            profile.setProfilePicture(user.getProfilePicture());
            profile.setIsActive(user.getIsActive());

            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            System.out.println("❌ Error getting user by ID: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Internal server error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Get all users (Admin only)
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getAllUsers(Authentication authentication) {
        try {
            User currentUser = extractUserFromAuthentication(authentication);

            if (!isAdmin(currentUser)) {
                return ResponseEntity.status(403).body(Map.of(
                        "error", "Forbidden",
                        "message", "Only admins can access user list"
                ));
            }

            var users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            System.out.println("❌ Error getting all users: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Internal server error",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Update last login time
     */
    @PostMapping(value = "/update-last-login", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateLastLogin(Authentication authentication) {
        try {
            User user = extractUserFromAuthentication(authentication);
            user.setLastLogin(LocalDateTime.now());
            userService.updateUser(user);

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Last login updated"
            ));
        } catch (Exception e) {
            System.out.println("❌ Error updating last login: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Internal server error",
                    "message", e.getMessage()
            ));
        }
    }

    // ===== HELPER METHODS =====

    private User extractUserFromAuthentication(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Authentication required");
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof tungdao.com.project1.login_register.UserDetailsImpl)) {
            throw new RuntimeException("Invalid authentication type: " + principal.getClass().getName());
        }

        tungdao.com.project1.login_register.UserDetailsImpl userDetails =
                (tungdao.com.project1.login_register.UserDetailsImpl) principal;

        // Get full user from database
        User user = userService.findById(userDetails.getId());
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        return user;
    }

    private boolean isAdmin(User user) {
        return user.getRole().toString().equals("ADMIN") ||
                user.getRole().toString().equals("ROLE_ADMIN");
    }

    private Object createEmptyTestStats() {
        return Map.of(
                "totalTests", 0,
                "averageScore", 0.0,
                "strongestSkill", "N/A",
                "weakestSkill", "N/A",
                "studyStreak", 0,
                "totalStudyHours", 0.0
        );
    }

    // ===== DTO CLASSES =====

    public static class UserProfileUpdateRequest {
        private String fullName;
        private String profilePicture;

        // Getters and setters
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getProfilePicture() { return profilePicture; }
        public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable int id) {
        try {
            userService.deleteUserById(id);
            return ResponseEntity.ok().body("User deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting user: " + e.getMessage());
        }
    }

}