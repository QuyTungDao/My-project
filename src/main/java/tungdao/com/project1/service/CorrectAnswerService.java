package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
import tungdao.com.project1.entity.CorrectAnswer;
import tungdao.com.project1.repository.CorrectAnswerRepository;

@Service
public class CorrectAnswerService {
    private final CorrectAnswerRepository correctAnswerRepository;

    public CorrectAnswerService(CorrectAnswerRepository correctAnswerRepository) {
        this.correctAnswerRepository = correctAnswerRepository;
    }

    public CorrectAnswer getByQuestionId(Integer questionId) {
        return correctAnswerRepository.findByQuestionId(questionId);
    }

    public CorrectAnswer saveCorrectAnswer(CorrectAnswer correctAnswer) {
        return correctAnswerRepository.save(correctAnswer);
    }
}
