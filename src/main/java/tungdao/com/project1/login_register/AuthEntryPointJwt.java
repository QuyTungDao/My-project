package tungdao.com.project1.login_register;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        logger.error("=== AUTHENTICATION ENTRY POINT TRIGGERED ===");
        logger.error("Request URI: {}", request.getRequestURI());
        logger.error("Request method: {}", request.getMethod());
        logger.error("Auth exception: {}", authException.getMessage());
        logger.error("User-Agent: {}", request.getHeader("User-Agent"));
        logger.error("Authorization header present: {}", request.getHeader("Authorization") != null);

        // ✅ Xác định lý do cụ thể của lỗi 401
        String errorMessage = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn";
        String errorCode = "UNAUTHORIZED";
        String debugInfo = "";

        // ✅ Phân tích chi tiết lỗi
        if (authException.getMessage() != null) {
            String message = authException.getMessage().toLowerCase();
            debugInfo = authException.getMessage();

            if (message.contains("expired") || message.contains("hết hạn")) {
                errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
                errorCode = "TOKEN_EXPIRED";
            } else if (message.contains("invalid") || message.contains("malformed")) {
                errorMessage = "Token không hợp lệ. Vui lòng đăng nhập lại.";
                errorCode = "INVALID_TOKEN";
            } else if (message.contains("missing") || message.contains("required")) {
                errorMessage = "Thiếu thông tin xác thực. Vui lòng đăng nhập để tiếp tục.";
                errorCode = "MISSING_AUTH";
            } else if (message.contains("access denied") || message.contains("forbidden")) {
                errorMessage = "Bạn không có quyền truy cập tài nguyên này.";
                errorCode = "ACCESS_DENIED";
            }
        }

        // ✅ Kiểm tra endpoint để tùy chỉnh message
        String requestURI = request.getRequestURI();
        if (requestURI.contains("/create")) {
            errorMessage = "Bạn cần đăng nhập để tạo bài thi. " + errorMessage;
        } else if (requestURI.contains("/attempts")) {
            errorMessage = "Bạn cần đăng nhập để nộp bài thi. " + errorMessage;
        } else if (requestURI.contains("/update")) {
            errorMessage = "Bạn cần đăng nhập để cập nhật bài thi. " + errorMessage;
        }

        // ✅ Tạo structured error response
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", System.currentTimeMillis());
        errorResponse.put("status", 401);
        errorResponse.put("error", "Unauthorized");
        errorResponse.put("message", errorMessage);
        errorResponse.put("code", errorCode);
        errorResponse.put("path", requestURI);

        // ✅ Thêm debug info cho development
        if (logger.isDebugEnabled()) {
            errorResponse.put("debug", debugInfo);
            errorResponse.put("method", request.getMethod());
        }

        // ✅ Set proper response headers và content
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // ✅ QUAN TRỌNG: Write JSON response body
        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);
        response.getWriter().flush();

        logger.error("Sent 401 response with message: {}", errorMessage);
        logger.error("Response body: {}", jsonResponse);
    }
}