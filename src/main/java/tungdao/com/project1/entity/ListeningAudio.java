package tungdao.com.project1.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "listening_audio")
@Getter
@Setter
@ToString(exclude = {"test", "questions"})
@EqualsAndHashCode(exclude = {"test", "questions"})
@NoArgsConstructor
@AllArgsConstructor
public class ListeningAudio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audio_id")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type")
    private AudioFileType fileType;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Enumerated(EnumType.STRING)
    private ListeningSection section;

    @Column(name = "order_in_test")
    private Integer orderInTest;

    @JsonProperty("audioBase64")
    @Lob // Large Object để lưu base64 data
    @Column(name = "audio_base64", columnDefinition = "LONGTEXT")
    private String audioBase64;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "original_file_name")
    private String originalFileName;

    @JsonProperty("mimeType")
    @Column(name = "mime_type", length = 50)
    private String mimeType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "audio")
    private Set<Question> questions = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        fileType = fileType == null ? AudioFileType.MP3 : fileType;
        orderInTest = orderInTest == null ? 1 : orderInTest;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Lấy URL để phát audio (ưu tiên base64, fallback file path)
     */

    // ✅ ADD TO ListeningAudio.java entity

    // Method để kiểm tra có base64 data không
    public boolean hasBase64Data() {
        return this.audioBase64 != null && !this.audioBase64.trim().isEmpty();
    }

    // Method để lấy MIME type hiệu quả
    public String getEffectiveMimeType() {
        if (this.mimeType != null && !this.mimeType.trim().isEmpty()) {
            return this.mimeType;
        }

        // Fallback based on file type
        switch (this.fileType != null ? this.fileType.name() : "MP3") {
            case "MP3":
                return "audio/mpeg";
            case "WAV":
                return "audio/wav";
            case "OGG":
                return "audio/ogg";
            case "M4A":
                return "audio/m4a";
            default:
                return "audio/mpeg";
        }
    }

    public String getDataUrl() {
        if (!hasBase64Data()) {
            return null;
        }

        String mimeType = getEffectiveMimeType();
        String base64Data = this.audioBase64;

        // Check if already in data URL format
        if (base64Data.startsWith("data:")) {
            return base64Data;
        }

        // Create proper data URL
        return "data:" + mimeType + ";base64," + base64Data;
    }

    /**
     * ✅ Validate base64 data integrity
     */
    public boolean isValidBase64() {
        if (!hasBase64Data()) {
            return false;
        }

        try {
            String base64Data = this.audioBase64;

            // Remove data URL prefix if present
            if (base64Data.startsWith("data:")) {
                int commaIndex = base64Data.indexOf(',');
                if (commaIndex > 0) {
                    base64Data = base64Data.substring(commaIndex + 1);
                }
            }

            // Try to decode to verify validity
            java.util.Base64.getDecoder().decode(base64Data);
            return true;
        } catch (Exception e) {
            System.err.println("❌ Invalid base64 data for audio " + this.id + ": " + e.getMessage());
            return false;
        }
    }

    /**
     * ✅ Enhanced debug with validation
     */
    public void debugAudioData() {
        System.out.println("=== LISTENING AUDIO DEBUG ===");
        System.out.println("ID: " + this.id);
        System.out.println("Title: " + this.title);
        System.out.println("Section: " + this.section);
        System.out.println("File Type: " + this.fileType);
        System.out.println("Order: " + this.orderInTest);
        System.out.println("Duration: " + this.durationSeconds);

        // Base64 data analysis
        System.out.println("Has audioBase64: " + (this.audioBase64 != null));
        if (this.audioBase64 != null) {
            System.out.println("AudioBase64 length: " + this.audioBase64.length());
            System.out.println("Is valid base64: " + this.isValidBase64());
            System.out.println("Data URL format: " + this.getDataUrl());

            if (this.audioBase64.length() > 50) {
                System.out.println("AudioBase64 preview: " + this.audioBase64.substring(0, 50) + "...");
            }
        }

        // File metadata
        System.out.println("Original filename: " + this.originalFileName);
        System.out.println("File size: " + this.fileSize + " bytes");
        System.out.println("MIME type: " + this.mimeType);
        System.out.println("Effective MIME type: " + this.getEffectiveMimeType());

        // Computed properties
        System.out.println("hasBase64Data(): " + this.hasBase64Data());

        // ✅ VALIDATION WARNINGS
        if (hasBase64Data() && !isValidBase64()) {
            System.err.println("⚠️ WARNING: Base64 data appears to be corrupted!");
        }


        System.out.println("================================");
    }
}
