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
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
// Loại bỏ annotation CORS dư thừa vì đã được xử lý trong WebConfig
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

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest req) {
        try {
            System.out.println("Đang xử lý đăng nhập cho: " + req.getEmail());

            // Kiểm tra xem user có tồn tại không
            Optional<User> userOpt = userRepo.findByEmail(req.getEmail());
            if (userOpt.isEmpty()) {
                System.out.println("User không tồn tại: " + req.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email không tồn tại trong hệ thống");
            }

            User user = userOpt.get();
            System.out.println("Tìm thấy user: " + user.getEmail());

            // In thông tin debug về password đã mã hóa trong database
            System.out.println("Password đã mã hóa trong DB: " + user.getPassword());

            // Xác thực
            Authentication auth;
            try {
                auth = authManager.authenticate(
                        new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
                );
                System.out.println("Xác thực thành công cho: " + req.getEmail());
            } catch (BadCredentialsException e) {
                System.out.println("Xác thực thất bại: Sai mật khẩu cho user " + req.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sai mật khẩu");
            }

            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();

            // Truyền đối tượng Authentication vào generateJwtToken
            String jwt = jwtUtils.generateJwtToken(auth);
            System.out.println("Đã tạo JWT token với độ dài: " + jwt.length());

            List<String> roles = userDetails.getAuthorities()
                    .stream()
                    .map(GrantedAuthority::getAuthority)
                    .toList();
            System.out.println("Roles của user: " + roles);

            // Tạo response
            JwtResponse body = new JwtResponse(
                    jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),   // chính là email
                    user.getFullName(),
                    roles
            );

            System.out.println("Đăng nhập thành công cho: " + req.getEmail());
            return ResponseEntity.ok(body);

        } catch (Exception e) {
            System.err.println("Lỗi đăng nhập: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Đăng nhập thất bại: " + e.getMessage());
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest req) {
        try {
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

            // Chuyển đổi role từ chữ thường sang chữ hoa để khớp với enum UserRole
            // Cách xử lý chuỗi tốt hơn để đảm bảo không gặp lỗi khi chuyển đổi enum
            String roleUpperCase = req.getRole().toUpperCase();
            System.out.println("Role sau khi chuyển đổi: " + roleUpperCase);

            // Kiểm tra giá trị enum trước khi gán
            try {
                UserRole userRole = UserRole.valueOf(roleUpperCase);
                u.setRole(userRole);
                System.out.println("Đã chuyển đổi thành công role thành: " + userRole);
            } catch (IllegalArgumentException e) {
                System.err.println("Không thể chuyển đổi role: " + roleUpperCase);
                System.err.println("Các giá trị hợp lệ của UserRole là: " + java.util.Arrays.toString(UserRole.values()));
                return ResponseEntity.badRequest().body("Invalid role: " + req.getRole() +
                        ". Valid roles are: student, teacher, admin (case insensitive)");
            }

            u.setCreatedAt(LocalDateTime.now());
            u.setUpdatedAt(LocalDateTime.now());
            u.setIsActive(true);

            User savedUser = userRepo.save(u);
            System.out.println("Đã lưu user: " + savedUser.getId());

            return ResponseEntity.ok("User registered successfully!");
        } catch (Exception e) {
            System.err.println("Lỗi khi đăng ký: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity
                    .badRequest()
                    .body("Error: " + e.getMessage());
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

            return ResponseEntity.ok(
                    "Kết quả kiểm tra mật khẩu: " + matches
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    // Endpoint test để kiểm tra user có tồn tại không
    @GetMapping("/check-user/{email}")
    public ResponseEntity<?> checkUserExists(@PathVariable String email) {
        boolean exists = userRepo.findByEmail(email).isPresent();
        return ResponseEntity.ok("User with email " + email + " exists: " + exists);
    }
}