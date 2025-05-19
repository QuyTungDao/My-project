
package tungdao.com.project1.service;

import org.springframework.stereotype.Service;
import tungdao.com.project1.entity.ListeningAudio;
import tungdao.com.project1.entity.Test;
import tungdao.com.project1.repository.ListeningAudioRepository;
import tungdao.com.project1.repository.TestRepository;

import java.util.Collections;
import java.util.List;

@Service
public class ListeningAudioService {
    private final ListeningAudioRepository listeningAudioRepository;
    private final TestRepository testRepository;

    public ListeningAudioService(ListeningAudioRepository listeningAudioRepository, TestRepository testRepository) {
        this.listeningAudioRepository = listeningAudioRepository;
        this.testRepository = testRepository;
    }

    public List<ListeningAudio> getAudiosByTestId(Integer testId) {
        // Lấy Test entity từ testId
        Test test = testRepository.findById(testId).orElse(null);
        if (test == null) {
            return Collections.emptyList();
        }
        return listeningAudioRepository.findByTestOrderByOrderInTest(test);
    }

    public ListeningAudio getAudioById(Integer id) {
        return listeningAudioRepository.findById(id).orElse(null);
    }

    public ListeningAudio saveAudio(ListeningAudio audio) {
        return listeningAudioRepository.save(audio);
    }
}