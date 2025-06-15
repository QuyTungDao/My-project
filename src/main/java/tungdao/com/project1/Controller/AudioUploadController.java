package tungdao.com.project1.Controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/test")
public class AudioUploadController {

    @Value("${app.upload.dir:${user.home}/uploads/audio}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadAudioFile(@RequestParam("file") MultipartFile file) {
        try {
            // Tạo thư mục lưu trữ nếu chưa tồn tại
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Tạo tên file duy nhất để tránh trùng lặp
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

            // Lưu file vào thư mục
            Path filePath = uploadPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Trả về thông tin file đã upload
            Map<String, Object> response = new HashMap<>();
            response.put("fileName", uniqueFileName);
            response.put("originalFileName", originalFileName);
            response.put("fileSize", file.getSize());
            response.put("filePath", "/uploads/audio/" + uniqueFileName);

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi upload file: " + e.getMessage());
        }
    }

    @PostMapping("/validate-file")
    public ResponseEntity<?> validateAudioFile(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println("=== VALIDATING AUDIO FILE ===");
            System.out.println("Original filename: " + file.getOriginalFilename());
            System.out.println("Content type: " + file.getContentType());
            System.out.println("File size: " + file.getSize() + " bytes");

            // ✅ VALIDATE FILE TYPE
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("audio/")) {
                return ResponseEntity.badRequest()
                        .body("File không phải là audio. Content-Type: " + contentType);
            }

            // ✅ VALIDATE FILE SIZE (limit 50MB)
            long maxSize = 50 * 1024 * 1024; // 50MB
            if (file.getSize() > maxSize) {
                return ResponseEntity.badRequest()
                        .body("File quá lớn. Kích thước tối đa: 50MB");
            }

            // ✅ CONVERT TO BASE64 and validate
            byte[] audioBytes = file.getBytes();
            String base64Data = java.util.Base64.getEncoder().encodeToString(audioBytes);
            String dataUrl = "data:" + contentType + ";base64," + base64Data;

            Map<String, Object> response = new HashMap<>();
            response.put("isValid", true);
            response.put("fileName", file.getOriginalFilename());
            response.put("contentType", contentType);
            response.put("fileSize", file.getSize());
            response.put("base64Data", dataUrl);
            response.put("base64Length", base64Data.length());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error validating audio: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi validate audio: " + e.getMessage());
        }
    }
}