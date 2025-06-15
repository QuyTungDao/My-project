package tungdao.com.project1.service;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import tungdao.com.project1.dto.QuestionCreateDTO;
import tungdao.com.project1.entity.Question;
import tungdao.com.project1.repository.QuestionRepository;

import java.util.List;

@Service
public class QuestionService {
    private final QuestionRepository questionRepository;

    public QuestionService(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    public List<Question> getQuestionsByTestId(Integer testId) {
        return questionRepository.findByTestIdOrderByOrderInTest(testId);
    }

    public Question getQuestionById(Integer id) {
        return questionRepository.findById(id).orElse(null);
    }

    public List<Question> getQuestionsByPassageId(Integer passageId) {
        return questionRepository.findByPassageIdOrderByOrderInTest(passageId);
    }

    public Question saveQuestion(Question question) {
        return questionRepository.save(question);
    }

    // ✅ NEW METHOD: Save question with context validation
    public Question saveQuestionWithContext(QuestionCreateDTO dto, Question existingQuestion) {
        if (existingQuestion == null) {
            existingQuestion = new Question();
        }

        // Map basic fields
        existingQuestion.setQuestionText(dto.getQuestionText());
        existingQuestion.setQuestionSetInstructions(dto.getQuestionSetInstructions());
        existingQuestion.setOrderInTest(dto.getOrderInTest());

        // ✅ CRITICAL: Handle context field properly
        if (dto.getContext() != null) {
            existingQuestion.setContext(dto.getContext());
            System.out.println("Setting context for question " + dto.getQuestionId() +
                    ": length=" + dto.getContext().length());
        } else {
            existingQuestion.setContext(""); // Set empty string instead of null
            System.out.println("No context provided for question " + dto.getQuestionId());
        }

        return questionRepository.save(existingQuestion);
    }

    // ✅ NEW METHOD: Batch save questions with context
    @Transactional
    public void saveQuestionsWithContext(List<QuestionCreateDTO> questionDTOs, Integer testId) {
        System.out.println("=== SAVING QUESTIONS WITH CONTEXT ===");
        System.out.println("Total questions to save: " + questionDTOs.size());

        for (QuestionCreateDTO dto : questionDTOs) {
            try {
                System.out.println("Processing question: " + dto.getQuestionId());
                System.out.println("  - Type: " + dto.getQuestionType());
                System.out.println("  - Has context: " + (dto.getContext() != null && !dto.getContext().trim().isEmpty()));
                System.out.println("  - Context length: " + (dto.getContext() != null ? dto.getContext().length() : 0));

                Question question = dto.getQuestionId() != null ?
                        getQuestionById(dto.getQuestionId()) : new Question();

                if (question == null) {
                    question = new Question();
                }

                // Map all fields including context
                question.setQuestionText(dto.getQuestionText());
                question.setQuestionSetInstructions(dto.getQuestionSetInstructions());
                question.setOrderInTest(dto.getOrderInTest());

                // ✅ CONTEXT HANDLING
                if (dto.getContext() != null && !dto.getContext().trim().isEmpty()) {
                    question.setContext(dto.getContext());
                    System.out.println("  ✅ Context saved: " + dto.getContext().substring(0, Math.min(100, dto.getContext().length())) + "...");
                } else {
                    question.setContext("");
                    System.out.println("  ❌ No context to save");
                }

                Question saved = questionRepository.save(question);
                System.out.println("  ✅ Question saved with ID: " + saved.getId());

            } catch (Exception e) {
                System.err.println("Error saving question " + dto.getQuestionId() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }

        System.out.println("=== FINISHED SAVING QUESTIONS ===");
    }
}
