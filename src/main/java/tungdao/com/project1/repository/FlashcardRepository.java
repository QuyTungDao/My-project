package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tungdao.com.project1.entity.FlashCard;
import tungdao.com.project1.entity.User;

import java.util.List;

@Repository
public interface FlashcardRepository extends JpaRepository<FlashCard, Integer> {

    List<FlashCard> findByCreator(User creator);

    List<FlashCard> findByCategory(String category);

    @Query("SELECT f FROM FlashCard f WHERE f.word LIKE %:keyword% OR f.meaning LIKE %:keyword%")
    List<FlashCard> searchByKeyword(String keyword);
}