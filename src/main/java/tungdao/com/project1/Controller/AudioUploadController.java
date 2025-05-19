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

    @PostMapping("/upload-audio")
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
}