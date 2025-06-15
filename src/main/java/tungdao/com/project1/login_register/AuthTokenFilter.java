package tungdao.com.project1.login_register;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import tungdao.com.project1.service.UserDetailsServiceImpl;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

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
            logger.info("🔍 Processing request: {} {}", method, uri);

            // ✅ COMPREHENSIVE FIX: Process JWT for ALL requests, let SecurityConfig handle authorization
            String jwt = parseJwt(request);

            if (jwt != null) {
                logger.info("🔑 JWT token found, validating...");

                try {
                    if (jwtUtils.validateJwtToken(jwt)) {
                        String username = jwtUtils.getUserNameFromJwtToken(jwt);
                        logger.info("✅ JWT valid for user: {}", username);

                        try {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                            // ✅ CRITICAL: Set authentication in SecurityContext
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            userDetails,
                                            null,
                                            userDetails.getAuthorities());

                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);

                            logger.info("🔐 Authentication set for '{}' with authorities: {}",
                                    username, userDetails.getAuthorities());

                        } catch (UsernameNotFoundException e) {
                            logger.error("❌ User not found even though JWT is valid: {}", e.getMessage());

                            // ✅ Only return error for endpoints that require auth AND are not handled by SecurityConfig
                            if (requiresAuthenticationByFilter(uri, method)) {
                                writeErrorResponse(response, "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
                                return;
                            }
                        }
                    } else {
                        logger.warn("⚠️ Invalid JWT token");

                        // ✅ Only return error for endpoints that require auth AND are not handled by SecurityConfig
                        if (requiresAuthenticationByFilter(uri, method)) {
                            writeErrorResponse(response, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                            return;
                        }
                    }
                } catch (Exception e) {
                    logger.error("❌ Cannot set user authentication: {}", e.getMessage());

                    // ✅ Only return error for endpoints that require auth AND are not handled by SecurityConfig
                    if (requiresAuthenticationByFilter(uri, method)) {
                        writeErrorResponse(response, "Lỗi xác thực: " + e.getMessage());
                        return;
                    }
                }
            } else {
                logger.info("ℹ️ No JWT token found in request");

                // ✅ Only return error for endpoints that require auth AND are not handled by SecurityConfig
                if (requiresAuthenticationByFilter(uri, method)) {
                    writeErrorResponse(response, "Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.");
                    return;
                }
            }
        } catch (Exception e) {
            logger.error("❌ Error processing JWT authentication: {}", e.getMessage());
            e.printStackTrace();
        }

        // ✅ Continue with the filter chain
        filterChain.doFilter(request, response);
    }

    /**
     * ✅ COMPREHENSIVE FIX: Only handle endpoints NOT covered by SecurityConfig
     * Remove ALL flashcard logic - let SecurityConfig handle flashcard module completely
     */
    private boolean requiresAuthenticationByFilter(String uri, String method) {
        logger.debug("🔍 Checking if {} {} requires authentication by FILTER", method, uri);

        // ✅ Public endpoints that DON'T require authentication
        if ("OPTIONS".equals(method)) {
            logger.debug("✅ OPTIONS request - public");
            return false;
        }

        if (uri.startsWith("/api/auth/")) {
            logger.debug("✅ Auth endpoint - public");
            return false;
        }

        if (uri.equals("/error")) {
            logger.debug("✅ Error endpoint - public");
            return false;
        }

        // ✅ COMPREHENSIVE FIX: REMOVE ALL FLASHCARD LOGIC
        // Let SecurityConfig handle ALL flashcard endpoints completely
        if (uri.startsWith("/api/flashcards/")) {
            logger.debug("🔄 FLASHCARD endpoint - delegated to SecurityConfig completely");
            return false; // SecurityConfig will handle ALL flashcard authentication/authorization
        }

        // ✅ PUBLIC TEST endpoints (keep existing logic for other modules)
        if ("GET".equals(method)) {
            if (uri.equals("/api/test") ||
                    uri.equals("/api/test/search") ||
                    uri.startsWith("/api/test/") && !uri.contains("/my-tests") && !uri.contains("/admin")) {
                logger.debug("✅ Public test GET endpoint - public");
                return false;
            }
        }

        // ✅ TEST authenticated endpoints (keep existing logic for backward compatibility)
        if (uri.startsWith("/api/test/")) {
            if (("POST".equals(method) && (uri.equals("/api/test/attempts") ||
                    uri.equals("/api/test/create") ||
                    uri.matches("/api/test/\\d+/update") ||
                    uri.matches("/api/test/\\d+/delete"))) ||
                    ("GET".equals(method) && (uri.equals("/api/test/my-tests") ||
                            uri.startsWith("/api/test/admin/")))) {

                logger.debug("🔐 Authenticated test endpoint - requires auth by filter");
                return true;
            }
        }

        // ✅ Admin endpoints (keep existing logic for backward compatibility)
        if (uri.startsWith("/api/admin/") || uri.startsWith("/api/users/")) {
            logger.debug("🔐 Admin endpoint - requires auth by filter");
            return true;
        }

        // ✅ Test attempts endpoints (keep existing logic for backward compatibility)
        if (uri.startsWith("/api/test-attempts/")) {
            logger.debug("🔐 Test attempts endpoint - requires auth by filter");
            return true;
        }

        // ✅ MVC endpoints (keep existing logic for backward compatibility)
        if (uri.startsWith("/flashcards/") || uri.startsWith("/api/tests/")) {
            logger.debug("🔐 MVC endpoint - requires auth by filter");
            return true;
        }

        // ✅ Default: if not explicitly public, require authentication
        logger.debug("🔐 Default behavior - requires auth for: {} {}", method, uri);
        return true;
    }

    /**
     * ✅ ENHANCED: Write JSON error response
     */
    private void writeErrorResponse(HttpServletResponse response, String message) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", System.currentTimeMillis());
        errorResponse.put("status", 401);
        errorResponse.put("error", "Unauthorized");
        errorResponse.put("message", message);

        ObjectMapper objectMapper = new ObjectMapper();
        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);
        response.getWriter().flush();

        logger.info("📤 Sent 401 JSON response: {}", message);
    }

    /**
     * ✅ ENHANCED: Parse JWT from request headers
     */
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        logger.debug("🔍 Raw Authorization header: {}",
                headerAuth != null ? (headerAuth.length() > 20 ? headerAuth.substring(0, 20) + "..." : headerAuth) : "null");

        if (StringUtils.hasText(headerAuth)) {
            if (headerAuth.startsWith("Bearer ")) {
                String token = headerAuth.substring(7);
                logger.debug("✅ Token extracted with Bearer prefix, length: {}", token.length());
                return token;
            } else {
                logger.warn("⚠️ Authorization header doesn't start with 'Bearer ': {}",
                        headerAuth.length() > 10 ? headerAuth.substring(0, 10) + "..." : headerAuth);

                // ✅ Try to handle token sent directly (fallback)
                if (headerAuth.length() > 20) { // Reasonable JWT length check
                    logger.debug("🔄 Trying token without Bearer prefix");
                    return headerAuth;
                }
            }
        }

        return null;
    }
}