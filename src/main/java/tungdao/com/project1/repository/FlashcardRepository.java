package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.FlashCard;
import tungdao.com.project1.entity.User;

import org.springframework.data.domain.Pageable;  // ✅ CORRECT IMPORT
import java.util.List;

@Repository
public interface FlashcardRepository extends JpaRepository<FlashCard, Integer> {

    List<FlashCard> findByCreator(User creator);

    List<FlashCard> findByCategory(String category);

    @Query("SELECT f FROM FlashCard f WHERE f.word LIKE %:keyword% OR f.meaning LIKE %:keyword%")
    List<FlashCard> searchByKeyword(String keyword);

    List<FlashCard> findBySetNameAndIsActiveTrue(String setName);

    // Tìm flashcards public
    List<FlashCard> findByIsPublicTrueAndIsActiveTrue();

    // Tìm theo category và difficulty
    List<FlashCard> findByCategoryAndDifficultyLevelAndIsActiveTrue(
            String category, FlashCard.DifficultyLevel difficultyLevel);

    // Tìm flashcards mới cho student (chưa có progress)
    @Query("SELECT f FROM FlashCard f WHERE f.isActive = true AND f.id NOT IN " +
            "(SELECT p.flashcard.id FROM StudentFlashcardProgress p WHERE p.student = :student)")
    List<FlashCard> findNewFlashcardsForStudent(@Param("student") User student, Pageable pageable);

    // Lấy tất cả sets
    @Query("SELECT DISTINCT f.setName FROM FlashCard f WHERE f.setName IS NOT NULL AND f.isActive = true")
    List<String> findAllSetNames();

    // Đếm số thẻ trong mỗi set
    @Query("SELECT f.setName, COUNT(f) FROM FlashCard f WHERE f.isActive = true GROUP BY f.setName")
    List<Object[]> countCardsBySet();

    // Tìm theo word type
    List<FlashCard> findByWordTypeAndIsActiveTrue(FlashCard.WordType wordType);
}