package tungdao.com.project1.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Table(name = "users")
@Entity
@Data
@Getter
@Setter
@ToString(exclude = {"createdTests", "flashcards", "testAttempts", "responses", "gradedResponses"})
@EqualsAndHashCode(exclude = {"createdTests", "flashcards", "testAttempts", "responses", "gradedResponses"})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Convert(converter = UserRoleConverter.class)
    @Column(nullable = false)
    private UserRole role;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "profile_picture")
    private String profilePicture;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @OneToMany(mappedBy = "creator")
    @JsonManagedReference("user-tests")
    private Set<Test> createdTests = new HashSet<>();

    @OneToMany(mappedBy = "creator")
    private Set<FlashCard> flashcards = new HashSet<>();

    @OneToMany(mappedBy = "student")
    @JsonManagedReference("user-attempts")
    private Set<TestAttempt> testAttempts = new HashSet<>();

    @OneToMany(mappedBy = "student")
    @JsonManagedReference("user-responses")
    private Set<StudentResponse> responses = new HashSet<>();

    @OneToMany(mappedBy = "grader")
    private Set<StudentResponse> gradedResponses = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        isActive = isActive == null ? Boolean.TRUE : isActive;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}