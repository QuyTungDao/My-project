package tungdao.com.project1.config;

import com.fasterxml.jackson.core.StreamReadConstraints;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")  // Use allowedOrigins with credentials=false
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(false)  // Temporarily disable
                .exposedHeaders("Authorization", "Content-Type", "Accept")
                .maxAge(86400);
    }

    // ✅ REMOVED: CorsFilter bean to avoid conflicts
    // @Bean
    // public CorsFilter corsFilter() { ... }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cấu hình để truy cập các file tĩnh được upload
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + System.getProperty("user.home") + "/uploads/");
    }

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new Jackson2ObjectMapperBuilder()
                .modules(new JavaTimeModule())
                .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();

        // Tắt tính năng SerializationFeature.FAIL_ON_EMPTY_BEANS để tránh lỗi serialize
        mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        // Bỏ qua các thuộc tính không xác định trong quá trình deserialization
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

        try {
            // ✅ FIX: Tăng giới hạn string length cho Base64 audio data
            StreamReadConstraints constraints = StreamReadConstraints.builder()
                    .maxStringLength(100_000_000) // 100MB limit thay vì 20MB mặc định
                    .maxNumberLength(10000)
                    .maxNestingDepth(2000)
                    .build();

            mapper.getFactory().setStreamReadConstraints(constraints);

            System.out.println("✅ Jackson ObjectMapper configured with increased string length limit: 100MB");
        } catch (Exception e) {
            System.err.println("❌ Failed to configure Jackson constraints: " + e.getMessage());
            e.printStackTrace();
        }

        return mapper;
    }

    @Bean
    public MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter() {
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper());
        return converter;
    }
}