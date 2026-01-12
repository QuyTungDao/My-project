package tungdao.com.project1.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import tungdao.com.project1.dto.CreateFlashcardRequest;
import tungdao.com.project1.dto.FlashcardStatistics;
import tungdao.com.project1.dto.RateFlashcardRequest;
import tungdao.com.project1.entity.FlashCard;
import tungdao.com.project1.entity.User;
import tungdao.com.project1.service.FlashcardService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = "/api/flashcards",produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FlashcardController {

    private final FlashcardService flashcardService;

    // ===== PUBLIC ENDPOINTS =====

    @GetMapping(value = "/public",produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<FlashCard>> getPublicFlashcards() {
        List<FlashCard> flashcards = flashcardService.getAllPublicFlashcards();
        return ResponseEntity.ok(flashcards);
    }

    @GetMapping(value = "/sets",produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<String>> getAllSets() {
        List<String> sets = flashcardService.getAllSetNames();
        return ResponseEntity.ok(sets);
    }

    @GetMapping(value = "/sets/{setName}",produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<FlashCard>> getFlashcardsBySet(@PathVariable String setName) {
        List<FlashCard> flashcards = flashcardService.getFlashcardsBySet(setName);
        return ResponseEntity.ok(flashcards);
    }

    // ===== STUDENT LEARNING ENDPOINTS =====

    @GetMapping(value = "/study/today", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<FlashCard>> getTodayStudyCards(Authentication authentication) {
        try {
            User student = extractUserFromAuthentication(authentication);
            List<FlashCard> cards = flashcardService.getTodayStudyCards(student);
            return ResponseEntity.ok(cards);
        } catch (Exception e) {
            System.out.println("❌ Error in getTodayStudyCards: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping(value = "/rate", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> rateFlashcard(
            @RequestBody RateFlashcardRequest request,
            Authentication authentication) {

        try {
            User student = extractUserFromAuthentication(authentication);

            // Validation
            if (request == null || request.getFlashcardId() == null || request.getRating() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Invalid request",
                        "message", "FlashcardId and Rating are required"
                ));
            }

            flashcardService.rateFlashcard(student, request.getFlashcardId(), request.getRating());
            return ResponseEntity.ok(Map.of("status", "success", "message", "Rating saved"));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Business logic error",
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            System.out.println("❌ Error in rateFlashcard: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Internal server error",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping(value = "/statistics", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FlashcardStatistics> getStatistics(Authentication authentication) {
        try {
            User student = extractUserFromAuthentication(authentication);
            FlashcardStatistics stats = flashcardService.getStudentStatistics(student);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.out.println("❌ Error in getStatistics: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    // ===== TEACHER/ADMIN ENDPOINTS =====

    @PostMapping(value = "/create", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FlashCard> createFlashcard(
            @RequestBody CreateFlashcardRequest request,
            Authentication authentication) {
        try {
            User creator = extractUserFromAuthentication(authentication);

            FlashCard flashcard = new FlashCard();
            flashcard.setCreator(creator);
            flashcard.setWord(request.getWord());
            flashcard.setMeaning(request.getMeaning());
            flashcard.setExampleSentence(request.getExampleSentence());
            flashcard.setContext(request.getContext());
            flashcard.setCategory(request.getCategory());
            flashcard.setPronunciation(request.getPronunciation());
            flashcard.setWordType(request.getWordType());
            flashcard.setSynonyms(request.getSynonyms());
            flashcard.setSetName(request.getSetName());
            flashcard.setIsPublic(request.getIsPublic());
            flashcard.setDifficultyLevel(request.getDifficultyLevel());

            FlashCard saved = flashcardService.createFlashcard(flashcard);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.out.println("❌ Error in createFlashcard: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    @PutMapping(value = "/{flashcardId}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FlashCard> updateFlashcard(
            @PathVariable Integer flashcardId,
            @RequestBody CreateFlashcardRequest request,
            Authentication authentication) {
        try {
            User user = extractUserFromAuthentication(authentication);

            FlashCard flashcard = new FlashCard();
            flashcard.setWord(request.getWord());
            flashcard.setMeaning(request.getMeaning());
            flashcard.setExampleSentence(request.getExampleSentence());
            flashcard.setContext(request.getContext());
            flashcard.setCategory(request.getCategory());
            flashcard.setPronunciation(request.getPronunciation());
            flashcard.setWordType(request.getWordType());
            flashcard.setSynonyms(request.getSynonyms());
            flashcard.setSetName(request.getSetName());
            flashcard.setIsPublic(request.getIsPublic());
            flashcard.setDifficultyLevel(request.getDifficultyLevel());

            FlashCard updated = flashcardService.updateFlashcard(flashcardId, flashcard, user);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            System.out.println("❌ Error in updateFlashcard: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    @DeleteMapping(value = "/{flashcardId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> deleteFlashcard(
            @PathVariable Integer flashcardId,
            Authentication authentication) {
        try {
            User user = extractUserFromAuthentication(authentication);
            flashcardService.deleteFlashcard(flashcardId, user);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Flashcard deleted"));
        } catch (Exception e) {
            System.out.println("❌ Error in deleteFlashcard: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Internal server error",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping(value = "/my-cards", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<FlashCard>> getMyFlashcards(Authentication authentication) {
        try {
            User creator = extractUserFromAuthentication(authentication);
            List<FlashCard> cards = flashcardService.getFlashcardsByCreator(creator);
            return ResponseEntity.ok(cards);
        } catch (Exception e) {
            System.out.println("❌ Error in getMyFlashcards: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    private User extractUserFromAuthentication(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Authentication required");
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof tungdao.com.project1.login_register.UserDetailsImpl)) {
            throw new RuntimeException("Invalid authentication type: " + principal.getClass().getName());
        }

        tungdao.com.project1.login_register.UserDetailsImpl userDetails =
                (tungdao.com.project1.login_register.UserDetailsImpl) principal;

        // Create minimal User object with required fields
        User user = new User();
        user.setId(userDetails.getId()); // Adjust if User.id is Integer: userDetails.getId()
        user.setEmail(userDetails.getUsername());
        // Add other fields if needed by service methods

        return user;
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deactivateFlashcard(@PathVariable int id) {
        flashcardService.deactivateFlashcardById(id);
        return ResponseEntity.ok("Flashcard deactivated");
    }

    @GetMapping
    public List<FlashCard> listActiveFlashcards() {
        return flashcardService.getAllActiveFlashcards();
    }
}