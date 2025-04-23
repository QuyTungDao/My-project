package tungdao.com.project1.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tungdao.com.project1.DTO.JwtResponse;
import tungdao.com.project1.DTO.LoginRequest;
import tungdao.com.project1.DTO.SignupRequest;
import tungdao.com.project1.entity.User;
import tungdao.com.project1.login_register.JwtUtils;
import tungdao.com.project1.login_register.UserDetailsImpl;
import tungdao.com.project1.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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

    @PostMapping("/signin")
    public ResponseEntity<JwtResponse> authenticateUser(@RequestBody LoginRequest req) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );
        UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
        // Nếu bạn cần fullName, bạn có thể:
        //   a) Lưu fullName trong UserDetailsImpl và expose getFullName()
        //   b) Hoặc query lại: User user = userRepo.findByEmail(req.getEmail()).get();
        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow();  // chắc chắn đã authenticate thành công

        String jwt = jwtUtils.generateJwtToken(userDetails);
        List<String> roles = userDetails.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        // Động bộ với constructor mới: (token, id, email, fullName, roles)
        JwtResponse body = new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),   // chính là email
                user.getFullName(),
                roles
        );
        return ResponseEntity.ok(body);
    }


    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest req) {
        if (userRepo.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Email is already in use!");
        }
        User u = new User();
        u.setFullName(req.getFullName());
        u.setEmail(req.getEmail());
        u.setPassword(encoder.encode(req.getPassword()));
        u.setRole(User.Role.valueOf(req.getRole()));
        u.setCreatedAt(LocalDateTime.now());
        u.setUpdatedAt(LocalDateTime.now());
        u.setIsActive(true);
        userRepo.save(u);
        return ResponseEntity.ok("User registered successfully!");
    }
}
