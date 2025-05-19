package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
import tungdao.com.project1.entity.StudentResponse;
import tungdao.com.project1.repository.StudentResponseRepository;

import java.util.List;

@Service
public class StudentResponseService {
    private final StudentResponseRepository studentResponseRepository;

    public StudentResponseService(StudentResponseRepository studentResponseRepository) {
        this.studentResponseRepository = studentResponseRepository;
    }

    public StudentResponse saveStudentResponse(StudentResponse response) {
        return studentResponseRepository.save(response);
    }

    public List<StudentResponse> getResponsesByAttemptId(Integer attemptId) {
        return studentResponseRepository.findByAttemptId(attemptId);
    }
}
