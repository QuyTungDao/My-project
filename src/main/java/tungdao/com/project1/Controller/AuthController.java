package tungdao.com.project1.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import tungdao.com.project1.entity.JwtResponse;
import tungdao.com.project1.entity.LoginRequest;
import tungdao.com.project1.entity.SignupRequest;
import tungdao.com.project1.entity.User;
import tungdao.com.project1.entity.UserRole;
import tungdao.com.project1.login_register.JwtUtils;
import tungdao.com.project1.login_register.UserDetailsImpl;
import tungdao.com.project1.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authManager;
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;

    public AuthController(AuthenticationManager authManager,
                          UserRepository userRepo,
                          PasswordEncoder encoder,
                          JwtUtils jwtUtils) {
        this.authManager = authManager;
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.jwtUtils = jwtUtils;
    }

    // ✅ ENHANCED: Login with role-aware JWT
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest req) {
        try {
            System.out.println("=== ENHANCED LOGIN WITH ROLE SUPPORT ===");
            System.out.println("Đang xử lý đăng nhập cho: " + req.getEmail());

            // Kiểm tra xem user có tồn tại không
            Optional<User> userOpt = userRepo.findByEmail(req.getEmail());
            if (userOpt.isEmpty()) {
                System.out.println("❌ User không tồn tại: " + req.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email không tồn tại trong hệ thống");
            }

            User user = userOpt.get();
            System.out.println("✅ Tìm thấy user: " + user.getEmail());
            System.out.println("✅ User role: " + user.getRole());
            System.out.println("✅ User ID: " + user.getId());

            // In thông tin debug về password đã mã hóa trong database
            System.out.println("Password đã mã hóa trong DB: " + user.getPassword());

            // Xác thực
            Authentication auth;
            try {
                auth = authManager.authenticate(
                        new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
                );
                System.out.println("✅ Xác thực thành công cho: " + req.getEmail());
            } catch (BadCredentialsException e) {
                System.out.println("❌ Xác thực thất bại: Sai mật khẩu cho user " + req.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sai mật khẩu");
            }

            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();

            // ✅ ENHANCED: Generate JWT with role information
            String jwt = jwtUtils.generateJwtToken(auth);
            System.out.println("✅ Đã tạo JWT token với độ dài: " + jwt.length());

            List<String> roles = userDetails.getAuthorities()
                    .stream()
                    .map(GrantedAuthority::getAuthority)
                    .toList();
            System.out.println("✅ Roles của user: " + roles);

            // ✅ ENHANCED: Create response with role information
            JwtResponse body = new JwtResponse(
                    jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),   // chính là email
                    user.getFullName(),
                    roles
            );

            // ✅ UPDATE: Set last login time
            user.setLastLogin(LocalDateTime.now());
            userRepo.save(user);

            System.out.println("=== LOGIN SUCCESS SUMMARY ===");
            System.out.println("User ID: " + userDetails.getId());
            System.out.println("Email: " + userDetails.getUsername());
            System.out.println("Full Name: " + user.getFullName());
            System.out.println("Role: " + user.getRole());
            System.out.println("JWT Token Length: " + jwt.length());
            System.out.println("✅ Đăng nhập thành công cho: " + req.getEmail());

            return ResponseEntity.ok(body);

        } catch (Exception e) {
            System.err.println("❌ Lỗi đăng nhập: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Đăng nhập thất bại: " + e.getMessage());
        }
    }

    // ✅ ENHANCED: Register with role validation
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest req) {
        try {
            System.out.println("=== ENHANCED REGISTRATION WITH ROLE VALIDATION ===");
            System.out.println("Registration request: " + req.toString());

            if (userRepo.findByEmail(req.getEmail()).isPresent()) {
                return ResponseEntity
                        .badRequest()
                        .body("Error: Email is already in use!");
            }

            // Log để debug
            System.out.println("Thông tin đăng ký: " + req.toString());

            User u = new User();
            u.setFullName(req.getFullName());
            u.setEmail(req.getEmail());
            u.setPassword(encoder.encode(req.getPassword()));

            // Ghi log mật khẩu đã mã hóa để debug
            System.out.println("Mật khẩu đã mã hóa: " + u.getPassword());

            // ✅ ENHANCED: Role validation with detailed logging
            String roleUpperCase = req.getRole().toUpperCase();
            System.out.println("✅ Role từ request: '" + req.getRole() + "' → '" + roleUpperCase + "'");

            // ✅ ROLE VALIDATION: Check if role is valid
            try {
                UserRole userRole = UserRole.valueOf(roleUpperCase);
                u.setRole(userRole);
                System.out.println("✅ Đã chuyển đổi thành công role thành: " + userRole);

                // ✅ LOG ROLE PERMISSIONS
                switch (userRole) {
                    case ADMIN:
                        System.out.println("🔑 ADMIN role - Full access granted");
                        break;
                    case TEACHER:
                        System.out.println("👨‍🏫 TEACHER role - Can create/manage tests");
                        break;
                    case STUDENT:
                        System.out.println("🎓 STUDENT role - Can take tests only");
                        break;
                }

            } catch (IllegalArgumentException e) {
                System.err.println("❌ Không thể chuyển đổi role: " + roleUpperCase);
                System.err.println("Các giá trị hợp lệ của UserRole là: " + java.util.Arrays.toString(UserRole.values()));
                return ResponseEntity.badRequest().body("Invalid role: " + req.getRole() +
                        ". Valid roles are: STUDENT, TEACHER, ADMIN (case insensitive)");
            }

            u.setCreatedAt(LocalDateTime.now());
            u.setUpdatedAt(LocalDateTime.now());
            u.setIsActive(true);

            User savedUser = userRepo.save(u);
            System.out.println("✅ Đã lưu user: " + savedUser.getId());

            System.out.println("=== REGISTRATION SUCCESS ===");
            System.out.println("User ID: " + savedUser.getId());
            System.out.println("Email: " + savedUser.getEmail());
            System.out.println("Role: " + savedUser.getRole());
            System.out.println("Full Name: " + savedUser.getFullName());

            return ResponseEntity.ok("User registered successfully with role: " + savedUser.getRole());
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi đăng ký: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity
                    .badRequest()
                    .body("Error: " + e.getMessage());
        }
    }

    // ✅ NEW: Get current user info from token
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("=== GET CURRENT USER INFO ===");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No valid token provided");
            }

            String token = authHeader.substring(7);

            if (!jwtUtils.validateJwtToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            // ✅ EXTRACT USER INFO FROM TOKEN
            String email = jwtUtils.getUserNameFromJwtToken(token);
            Integer userId = jwtUtils.getUserIdFromJwtToken(token);
            String role = jwtUtils.getRoleFromJwtToken(token);
            String fullName = jwtUtils.getFullNameFromJwtToken(token);

            System.out.println("✅ Current user info extracted:");
            System.out.println("  - ID: " + userId);
            System.out.println("  - Email: " + email);
            System.out.println("  - Role: " + role);
            System.out.println("  - Full Name: " + fullName);

            // ✅ VERIFY USER STILL EXISTS IN DATABASE
            Optional<User> userOpt = userRepo.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }

            User user = userOpt.get();

            // ✅ CREATE RESPONSE
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("email", user.getEmail());
            userInfo.put("fullName", user.getFullName());
            userInfo.put("role", user.getRole().toString());
            userInfo.put("isActive", user.getIsActive());
            userInfo.put("lastLogin", user.getLastLogin());

            return ResponseEntity.ok(userInfo);

        } catch (Exception e) {
            System.err.println("❌ Error getting current user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting user info: " + e.getMessage());
        }
    }

    // Endpoint kiểm tra mật khẩu - chỉ sử dụng cho debug
    @PostMapping("/check-password")
    public ResponseEntity<?> checkPassword(@RequestBody LoginRequest req) {
        try {
            Optional<User> userOpt = userRepo.findByEmail(req.getEmail());
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("User không tồn tại");
            }

            User user = userOpt.get();

            // Kiểm tra mật khẩu
            boolean matches = encoder.matches(req.getPassword(), user.getPassword());

            // Thông tin debug
            System.out.println("Email: " + req.getEmail());
            System.out.println("Raw password: " + req.getPassword());
            System.out.println("Encoded password in DB: " + user.getPassword());
            System.out.println("Password matches: " + matches);
            System.out.println("User role: " + user.getRole()); // ✅ Added role info

            return ResponseEntity.ok(
                    "Kết quả kiểm tra mật khẩu: " + matches +
                            " (Role: " + user.getRole() + ")"
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    // Endpoint test để kiểm tra user có tồn tại không
    @GetMapping("/check-user/{email}")
    public ResponseEntity<?> checkUserExists(@PathVariable String email) {
        Optional<User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return ResponseEntity.ok("User with email " + email + " exists: true" +
                    " (Role: " + user.getRole() + ", ID: " + user.getId() + ")");
        } else {
            return ResponseEntity.ok("User with email " + email + " exists: false");
        }
    }
}