package tungdao.com.project1.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tungdao.com.project1.dto.StudySession;
import tungdao.com.project1.entity.User;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class StudySessionService {

    // In-memory session tracking (có thể thay bằng Redis)
    private final Map<Integer, StudySession> activeSessions = new ConcurrentHashMap<>();

    public StudySession startSession(User student) {
        StudySession session = StudySession.builder()
                .studentId(student.getId())
                .startTime(LocalDateTime.now())
                .cardsStudied(0)
                .correctCount(0)
                .build();

        activeSessions.put(student.getId(), session);
        return session;
    }

    public StudySession updateSession(User student, boolean wasCorrect) {
        StudySession session = activeSessions.get(student.getId());
        if (session != null) {
            session.setCardsStudied(session.getCardsStudied() + 1);
            if (wasCorrect) {
                session.setCorrectCount(session.getCorrectCount() + 1);
            }
        }
        return session;
    }

    public StudySession endSession(User student) {
        StudySession session = activeSessions.remove(student.getId());
        if (session != null) {
            session.setEndTime(LocalDateTime.now());
            // Có thể lưu vào database để tracking lâu dài
        }
        return session;
    }

    public StudySession getCurrentSession(User student) {
        return activeSessions.get(student.getId());
    }
}