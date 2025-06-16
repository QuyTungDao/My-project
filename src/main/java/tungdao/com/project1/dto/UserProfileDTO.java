package tungdao.com.project1.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserProfileDTO {
    private Integer id;
    private String fullName;
    private String email;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private String profilePicture;
    private Boolean isActive;
}