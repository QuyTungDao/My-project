package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
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
}
