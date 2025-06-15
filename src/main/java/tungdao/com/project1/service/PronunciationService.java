package tungdao.com.project1.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PronunciationService {

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Tự động lấy pronunciation và audio URL từ Dictionary API
     */
    public PronunciationData getPronunciationData(String word) {
        try {
            String url = "https://api.dictionaryapi.dev/api/v2/entries/en/" + word.toLowerCase();

            // Call API
            Map<String, Object>[] response = restTemplate.getForObject(url, Map[].class);

            if (response != null && response.length > 0) {
                Map<String, Object> entry = response[0];

                // Extract phonetics
                Object phoneticsObj = entry.get("phonetics");
                if (phoneticsObj instanceof Map[] phonetics && phonetics.length > 0) {

                    for (Map<String, Object> phonetic : phonetics) {
                        String text = (String) phonetic.get("text");
                        String audio = (String) phonetic.get("audio");

                        if (text != null && audio != null && !audio.isEmpty()) {
                            return PronunciationData.builder()
                                    .pronunciation(text)
                                    .audioUrl(audio)
                                    .build();
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.warn("Could not fetch pronunciation for word: " + word, e);
        }

        // Fallback: return empty data
        return PronunciationData.builder()
                .pronunciation("")
                .audioUrl("")
                .build();
    }

    /**
     * Generate audio URL using Text-to-Speech (fallback)
     */
    public String generateTTSUrl(String word) {
        // Sử dụng ResponsiveVoice (miễn phí)
        return "https://responsivevoice.org/responsivevoice/getvoice.php?t=" +
                word + "&tl=en&sv=g1&vn=&pitch=0.5&rate=0.5&vol=1";
    }

    @lombok.Data
    @lombok.Builder
    public static class PronunciationData {
        private String pronunciation;
        private String audioUrl;
    }
}