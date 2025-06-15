package tungdao.com.project1.login_register;

import io.jsonwebtoken.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import tungdao.com.project1.entity.User;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${app.jwtSecret}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs}")
    private int jwtExpirationMs;

    // ✅ ENHANCED: Generate JWT token with role information
    public String generateJwtToken(Authentication authentication) {
        if (authentication == null) {
            logger.error("Authentication object is null - cannot generate token");
            throw new IllegalArgumentException("Authentication object cannot be null");
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetailsImpl)) {
            logger.error("Principal is not UserDetailsImpl: {}", principal.getClass().getName());
            throw new IllegalArgumentException("Principal must be instance of UserDetailsImpl");
        }

        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        logger.info("Generating JWT token for user: {}", userPrincipal.getUsername());
        logger.info("JWT expiration time set to: {} milliseconds", jwtExpirationMs);

        // ✅ CRITICAL: Extract roles from authentication
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        logger.info("User roles: {}", roles);

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        logger.info("Token issue time: {}", now);
        logger.info("Token expiry time: {}", expiryDate);

        // Validate secret key
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            logger.error("JWT secret key is missing! Cannot generate token.");
            throw new IllegalStateException("JWT secret key is not configured");
        }

        if (jwtSecret.length() < 32) {
            logger.warn("JWT secret key is too short! This may cause security issues. Recommended length is at least 32 characters.");
        }

        // ✅ BUILD TOKEN WITH ENHANCED CLAIMS
        String token = Jwts.builder()
                .setSubject(userPrincipal.getUsername()) // Email as subject
                .claim("userId", userPrincipal.getId()) // ✅ Add user ID
                .claim("email", userPrincipal.getUsername()) // ✅ Add email explicitly
                .claim("fullName", userPrincipal.getUsername()) // ✅ Add full name
                .claim("role", roles.isEmpty() ? "STUDENT" : roles.get(0)) // ✅ Add primary role
                .claim("authorities", roles) // ✅ Add all authorities
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();

        logger.info("✅ JWT token generated successfully with role information");
        logger.info("Token length: {}", token.length());
        logger.info("Token contains: userId={}, email={}, role={}",
                userPrincipal.getId(), userPrincipal.getUsername(), roles.isEmpty() ? "STUDENT" : roles.get(0));
        logger.debug("Token begins with: {}", token.substring(0, Math.min(10, token.length())));

        return token;
    }

    // ✅ ENHANCED: Generate token from user entity with role
    public String generateTokenFromUser(User user) {
        logger.info("Generating JWT token from User entity: {}", user.getEmail());

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        String role = user.getRole() != null ? user.getRole().toString() : "STUDENT";

        String token = Jwts.builder()
                .setSubject(user.getEmail())
                .claim("userId", user.getId())
                .claim("email", user.getEmail())
                .claim("fullName", user.getFullName())
                .claim("role", role)
                .claim("authorities", List.of("ROLE_" + role)) // Spring Security format
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();

        logger.info("✅ JWT token generated for user: {} with role: {}", user.getEmail(), role);
        return token;
    }

    // Existing method - keep as is
    public String generateTokenFromUsername(String username) {
        logger.info("Generating JWT token from username: {}", username);

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        String token = Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();

        logger.info("JWT token generated successfully for username: {}", username);
        return token;
    }

    public String getUserNameFromJwtToken(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                logger.error("Empty token provided");
                return null;
            }

            String username = Jwts.parser()
                    .setSigningKey(jwtSecret)
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();

            logger.info("Username extracted from token: {}", username);
            return username;
        } catch (Exception e) {
            logger.error("Could not extract username from token: {}", e.getMessage());
            return null;
        }
    }

    // ✅ NEW: Extract user ID from token
    public Integer getUserIdFromJwtToken(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                logger.error("Empty token provided");
                return null;
            }

            Claims claims = Jwts.parser()
                    .setSigningKey(jwtSecret)
                    .parseClaimsJws(token)
                    .getBody();

            Object userIdClaim = claims.get("userId");
            if (userIdClaim != null) {
                return Integer.valueOf(userIdClaim.toString());
            }

            logger.warn("No userId claim found in token");
            return null;
        } catch (Exception e) {
            logger.error("Could not extract userId from token: {}", e.getMessage());
            return null;
        }
    }

    // ✅ NEW: Extract role from token
    public String getRoleFromJwtToken(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                logger.error("Empty token provided");
                return null;
            }

            Claims claims = Jwts.parser()
                    .setSigningKey(jwtSecret)
                    .parseClaimsJws(token)
                    .getBody();

            String role = claims.get("role", String.class);
            logger.info("Role extracted from token: {}", role);
            return role != null ? role : "STUDENT"; // Default to STUDENT
        } catch (Exception e) {
            logger.error("Could not extract role from token: {}", e.getMessage());
            return "STUDENT"; // Default role
        }
    }

    // ✅ NEW: Extract full name from token
    public String getFullNameFromJwtToken(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                return null;
            }

            Claims claims = Jwts.parser()
                    .setSigningKey(jwtSecret)
                    .parseClaimsJws(token)
                    .getBody();

            return claims.get("fullName", String.class);
        } catch (Exception e) {
            logger.error("Could not extract fullName from token: {}", e.getMessage());
            return null;
        }
    }

    // ✅ NEW: Extract all claims for frontend use
    public Claims getAllClaims(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                return null;
            }

            return Jwts.parser()
                    .setSigningKey(jwtSecret)
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            logger.error("Could not extract claims from token: {}", e.getMessage());
            return null;
        }
    }

    public boolean validateJwtToken(String authToken) {
        try {
            logger.info("Validating JWT token");

            if (authToken == null || authToken.trim().isEmpty()) {
                logger.error("Empty token provided for validation");
                return false;
            }

            Jws<Claims> claims = Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(authToken);

            // Kiểm tra thời gian hết hạn
            Date expirationDate = claims.getBody().getExpiration();
            Date now = new Date();

            logger.info("Token expiration date: {}", expirationDate);
            logger.info("Current date: {}", now);
            logger.info("Seconds until expiration: {}", (expirationDate.getTime() - now.getTime()) / 1000);

            // ✅ ENHANCED: Log token claims for debugging
            Claims tokenClaims = claims.getBody();
            logger.debug("Token claims: userId={}, role={}, email={}",
                    tokenClaims.get("userId"), tokenClaims.get("role"), tokenClaims.get("email"));

            // Thêm kiểm tra nếu token sắp hết hạn (còn dưới 5 phút)
            if (expirationDate.getTime() - now.getTime() < 300000) { // 5 phút = 300,000 ms
                logger.warn("Token will expire soon (in less than 5 minutes)");
                // Vẫn trả về true để cho phép request hiện tại, nhưng frontend nên refresh token
            }

            // Kiểm tra xem token đã hết hạn chưa
            if (expirationDate.before(now)) {
                logger.warn("Token has expired!");
                return false;
            }

            logger.info("✅ JWT token is valid");
            return true;
        } catch (SignatureException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired. Expiration: {}, Current time: {}",
                    e.getClaims().getExpiration(), new Date());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error during JWT validation: {}", e.getMessage());
            e.printStackTrace();
        }

        return false;
    }

    // Kiểm tra xem token có hết hạn hay không
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = Jwts.parser()
                    .setSigningKey(jwtSecret)
                    .parseClaimsJws(token)
                    .getBody()
                    .getExpiration();
            return expiration.before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        } catch (Exception e) {
            logger.error("Error checking token expiration: {}", e.getMessage());
            return true; // Xem như hết hạn nếu có lỗi
        }
    }
}