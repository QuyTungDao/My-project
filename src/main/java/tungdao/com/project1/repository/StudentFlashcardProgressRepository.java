package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tungdao.com.project1.entity.StudentFlashcardProgress;

public interface StudentFlashcardProgressRepository extends JpaRepository<StudentFlashcardProgress, Integer> {
}
