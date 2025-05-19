package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
import tungdao.com.project1.entity.ReadingPassage;
import tungdao.com.project1.repository.ReadingPassageRepository;

import java.util.List;

@Service
public class ReadingPassageService {
    private final ReadingPassageRepository passageRepository;
    private final ReadingPassageRepository readingPassageRepository;

    public ReadingPassageService(ReadingPassageRepository passageRepository, ReadingPassageRepository readingPassageRepository) {
        this.passageRepository = passageRepository;
        this.readingPassageRepository = readingPassageRepository;
    }

    public List<ReadingPassage> getPassagesByTestId(Integer testId) {
        return passageRepository.findByTestIdOrderByOrderInTest(testId);
    }

    public ReadingPassage getPassageById(Integer id) {
        return readingPassageRepository.findById(id).orElse(null);
    }

    public ReadingPassage savePassage(ReadingPassage passage) {
        return readingPassageRepository.save(passage);
    }
}
