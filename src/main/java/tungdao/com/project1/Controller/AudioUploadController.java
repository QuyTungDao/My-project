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

    // ✅ UPDATED: 100MB limit constant
    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

    @PostMapping("/upload")
    public ResponseEntity<?> uploadAudioFile(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println("=== AUDIO FILE UPLOAD (100MB LIMIT) ===");
            System.out.println("File: " + file.getOriginalFilename());
            System.out.println("Size: " + formatFileSize(file.getSize()));

            // ✅ VALIDATE FILE SIZE FIRST
            if (file.getSize() > MAX_FILE_SIZE) {
                return ResponseEntity.badRequest()
                        .body("File quá lớn. Kích thước tối đa: 100MB. File hiện tại: " +
                                formatFileSize(file.getSize()));
            }

            // Tạo thư mục lưu trữ nếu chưa tồn tại
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("✅ Created upload directory: " + uploadPath);
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

            System.out.println("✅ File saved successfully: " + uniqueFileName);

            // Trả về thông tin file đã upload
            Map<String, Object> response = new HashMap<>();
            response.put("fileName", uniqueFileName);
            response.put("originalFileName", originalFileName);
            response.put("fileSize", file.getSize());
            response.put("fileSizeFormatted", formatFileSize(file.getSize()));
            response.put("filePath", "/uploads/audio/" + uniqueFileName);
            response.put("maxFileSize", MAX_FILE_SIZE);
            response.put("maxFileSizeFormatted", "100MB");

            return ResponseEntity.ok(response);
        } catch (IOException e) {
            System.err.println("❌ Error uploading file: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi upload file: " + e.getMessage());
        }
    }

    @PostMapping("/validate-file")
    public ResponseEntity<?> validateAudioFile(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println("=== VALIDATING AUDIO FILE (100MB LIMIT) ===");
            System.out.println("Original filename: " + file.getOriginalFilename());
            System.out.println("Content type: " + file.getContentType());
            System.out.println("File size: " + formatFileSize(file.getSize()));

            // ✅ VALIDATE FILE SIZE (updated to 100MB)
            if (file.getSize() > MAX_FILE_SIZE) {
                return ResponseEntity.badRequest()
                        .body("File quá lớn. Kích thước tối đa: 100MB. File hiện tại: " +
                                formatFileSize(file.getSize()));
            }

            // ✅ VALIDATE FILE TYPE
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("audio/")) {
                return ResponseEntity.badRequest()
                        .body("File không phải là audio. Content-Type: " + contentType);
            }

            // ✅ ADDITIONAL VALIDATION: Check if file is not empty
            if (file.getSize() == 0) {
                return ResponseEntity.badRequest()
                        .body("File rỗng. Vui lòng chọn file audio hợp lệ.");
            }

            // ✅ CONVERT TO BASE64 and validate
            System.out.println("Converting to Base64...");
            byte[] audioBytes = file.getBytes();
            String base64Data = java.util.Base64.getEncoder().encodeToString(audioBytes);
            String dataUrl = "data:" + contentType + ";base64," + base64Data;

            System.out.println("✅ Conversion successful");
            System.out.println("Base64 length: " + base64Data.length() + " characters");

            Map<String, Object> response = new HashMap<>();
            response.put("isValid", true);
            response.put("fileName", file.getOriginalFilename());
            response.put("contentType", contentType);
            response.put("fileSize", file.getSize());
            response.put("fileSizeFormatted", formatFileSize(file.getSize()));
            response.put("base64Data", dataUrl);
            response.put("base64Length", base64Data.length());
            response.put("maxFileSize", MAX_FILE_SIZE);
            response.put("maxFileSizeFormatted", "100MB");

            return ResponseEntity.ok(response);

        } catch (OutOfMemoryError e) {
            System.err.println("❌ Out of memory error - file too large for Base64 conversion");
            return ResponseEntity.status(HttpStatus.REQUEST_ENTITY_TOO_LARGE)
                    .body("File quá lớn để convert sang Base64. Vui lòng sử dụng file upload thay vì Base64.");
        } catch (Exception e) {
            System.err.println("❌ Error validating audio: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi validate audio: " + e.getMessage());
        }
    }

    // ✅ ADD UTILITY METHOD for file size formatting
    private String formatFileSize(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return String.format("%.1f KB", bytes / 1024.0);
        } else {
            return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        }
    }

    // ✅ ADD ENDPOINT to get current file size limits
    @GetMapping("/upload-limits")
    public ResponseEntity<?> getUploadLimits() {
        Map<String, Object> limits = new HashMap<>();
        limits.put("maxFileSize", MAX_FILE_SIZE);
        limits.put("maxFileSizeFormatted", "100MB");
        limits.put("supportedFormats", new String[]{"audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/mpeg"});

        return ResponseEntity.ok(limits);
    }
}