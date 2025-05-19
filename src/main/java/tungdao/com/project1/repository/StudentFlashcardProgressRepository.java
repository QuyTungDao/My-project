package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.FlashCard;
import tungdao.com.project1.entity.StudentFlashcardProgress;
import tungdao.com.project1.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentFlashcardProgressRepository extends JpaRepository<StudentFlashcardProgress, Integer> {

    List<StudentFlashcardProgress> findByStudent(User student);

    List<StudentFlashcardProgress> findByFlashcard(FlashCard flashcard);

    Optional<StudentFlashcardProgress> findByStudentAndFlashcard(User student, FlashCard flashcard);

    @Query("SELECT sfp FROM StudentFlashcardProgress sfp WHERE sfp.student = :student AND sfp.nextReviewDate <= :now")
    List<StudentFlashcardProgress> findDueFlashcards(User student, LocalDateTime now);
}