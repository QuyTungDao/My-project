package tungdao.com.project1.login_register;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import tungdao.com.project1.service.UserDetailsServiceImpl;

import java.io.IOException;

public class AuthTokenFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;

    public AuthTokenFilter(JwtUtils jwtUtils, UserDetailsServiceImpl uds) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = uds;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String uri = request.getRequestURI();
            String method = request.getMethod();
            logger.info("Processing request: {} {}", method, uri);

            // Xác định các endpoint yêu cầu xác thực
            boolean requiresAuth = false;

            // Endpoint nộp bài và tạo bài thi yêu cầu xác thực
            if ((uri.equals("/api/test/attempts") && method.equals("POST")) ||
                    (uri.equals("/api/test/create") && method.equals("POST"))) {
                requiresAuth = true;
                logger.info("Endpoint requires authentication: {}", uri);
            }

            // Bỏ qua xác thực JWT cho các endpoint không yêu cầu xác thực
            if (!requiresAuth && (uri.startsWith("/api/auth/") ||
                    (uri.startsWith("/api/test/") && method.equals("GET")) ||
                    uri.equals("/api/test/upload-audio"))) {
                logger.info("Public endpoint - skipping JWT validation for: {}", uri);
                filterChain.doFilter(request, response);
                return;
            }

            // Xử lý JWT token
            String headerAuth = request.getHeader("Authorization");
            logger.info("Authorization header: {}", headerAuth != null ?
                    (headerAuth.length() > 20 ? headerAuth.substring(0, 20) + "..." : headerAuth) : "null");

            String jwt = parseJwt(request);
            if (jwt != null) {
                try {
                    logger.info("JWT token extracted, length: {}", jwt.length());

                    // Kiểm tra token có hợp lệ không
                    if (jwtUtils.validateJwtToken(jwt)) {
                        String username = jwtUtils.getUserNameFromJwtToken(jwt);
                        logger.info("JWT valid for user: {}", username);

                        try {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            userDetails,
                                            null,
                                            userDetails.getAuthorities());

                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);

                            logger.info("Set authentication in security context for '{}'", username);
                        } catch (UsernameNotFoundException e) {
                            logger.error("User not found even though JWT is valid: {}", e.getMessage());

                            // Xử lý khi không tìm thấy người dùng
                            if (requiresAuth) {
                                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                response.getWriter().write("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
                                return;
                            }
                        }
                    } else {
                        logger.warn("Invalid JWT token");

                        // Nếu yêu cầu xác thực và token không hợp lệ
                        if (requiresAuth) {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tạo bài thi.");
                            return;
                        }
                    }
                } catch (Exception e) {
                    logger.error("Cannot set user authentication: {}", e.getMessage());

                    // Nếu yêu cầu xác thực và có lỗi
                    if (requiresAuth) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.getWriter().write("Lỗi xác thực: " + e.getMessage());
                        return;
                    }
                }
            } else {
                logger.info("No JWT token found in request");

                // Nếu yêu cầu xác thực nhưng không có token
                if (requiresAuth) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.");
                    return;
                }
            }
        } catch (Exception e) {
            logger.error("Error processing JWT authentication: {}", e.getMessage());
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        logger.debug("Raw Authorization header: {}", headerAuth);

        if (StringUtils.hasText(headerAuth)) {
            // Kiểm tra cả hai trường hợp: với và không có tiền tố "Bearer "
            if (headerAuth.startsWith("Bearer ")) {
                String token = headerAuth.substring(7);
                logger.info("Token extracted from Authorization header with Bearer prefix, length: {}", token.length());
                return token;
            } else {
                // Nếu token không có tiền tố "Bearer " (có thể client gửi token trực tiếp)
                logger.warn("Authorization header does not start with 'Bearer ' prefix: {}",
                        headerAuth.length() > 10 ? headerAuth.substring(0, 10) + "..." : headerAuth);

                // Thử xử lý trường hợp token được gửi trực tiếp
                return headerAuth;
            }
        }

        return null;
    }
}