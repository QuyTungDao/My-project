package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
import tungdao.com.project1.entity.Question;
import tungdao.com.project1.entity.ResponseType;
import tungdao.com.project1.entity.StudentResponse;
import tungdao.com.project1.repository.QuestionRepository;
import tungdao.com.project1.repository.StudentResponseRepository;

import java.math.BigDecimal;
import java.util.List;

@Service
public class WritingSpeakingService {

    private final QuestionRepository questionRepository;
    private final StudentResponseRepository studentResponseRepository;

    public WritingSpeakingService(QuestionRepository questionRepository,
                                  StudentResponseRepository studentResponseRepository) {
        this.questionRepository = questionRepository;
        this.studentResponseRepository = studentResponseRepository;
    }

    /**
     * ✅ Get IELTS standard time and word limits (business logic)
     */

    public int getWordLimit(String taskType) {
        if (taskType == null) return 0;

        switch (taskType) {
            case "WRITING_TASK1_ACADEMIC":
            case "WRITING_TASK1_GENERAL":
                return 150; // words
            case "WRITING_TASK2":
                return 250; // words
            default:
                return 0;
        }
    }


    /**
     * ✅ Count words in text (IELTS standard)
     */
    public int countWords(String text) {
        if (text == null || text.trim().isEmpty()) return 0;

        return text.trim()
                .replaceAll("\\s+", " ") // Multiple spaces to single space
                .split(" ")
                .length;
    }

    /**
     * ✅ Save speaking response with audio
     */
    public StudentResponse saveSpeakingResponse(Integer questionId, Integer attemptId,
                                                String audioBase64, Integer duration, String mimeType) {
        StudentResponse response = new StudentResponse();
        // Set basic fields...
        response.setResponseType(ResponseType.AUDIO);
        response.setAudioBase64(audioBase64);
        response.setAudioDurationSeconds(duration);
        response.setAudioMimeType(mimeType);

        return studentResponseRepository.save(response);
    }

    /**
     * ✅ Save writing response with word count
     */
    public StudentResponse saveWritingResponse(Integer questionId, Integer attemptId, String text) {
        StudentResponse response = new StudentResponse();
        // Set basic fields...
        response.setResponseType(ResponseType.TEXT);
        response.setResponseText(text);
        response.setWordCount(countWords(text));

        return studentResponseRepository.save(response);
    }

    /**
     * ✅ Validate word count for writing
     */
    public boolean isWordCountValid(String taskType, int wordCount) {
        int required = getWordLimit(taskType);
        return required == 0 || wordCount >= required;
    }
}