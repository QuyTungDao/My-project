package tungdao.com.project1.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tungdao.com.project1.entity.FlashCard;

public interface FlashcardRepository extends JpaRepository<FlashCard, Integer> {
}
