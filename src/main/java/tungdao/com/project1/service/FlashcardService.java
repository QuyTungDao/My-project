package tungdao.com.project1.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tungdao.com.project1.dto.FlashcardStatistics;
import tungdao.com.project1.entity.*;
import tungdao.com.project1.repository.FlashcardRepository;
import tungdao.com.project1.repository.StudentFlashcardProgressRepository;
import tungdao.com.project1.repository.StudentProgressRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final StudentFlashcardProgressRepository progressRepository;
    private final StudentProgressRepository studentProgressRepository;

    // ===== FLASHCARD CRUD =====

    public FlashCard createFlashcard(FlashCard flashcard) {
        return flashcardRepository.save(flashcard);
    }

    public List<FlashCard> getAllPublicFlashcards() {
        return flashcardRepository.findByIsPublicTrueAndIsActiveTrue();
    }

    public List<FlashCard> getFlashcardsBySet(String setName) {
        return flashcardRepository.findBySetNameAndIsActiveTrue(setName);
    }

    public List<String> getAllSetNames() {
        return flashcardRepository.findAllSetNames();
    }

    // ===== LEARNING LOGIC =====

    /**
     * Lấy thẻ cần học hôm nay (ôn tập + từ mới)
     * Giới hạn 20 thẻ/ngày như trong UI
     */
    public List<FlashCard> getTodayStudyCards(User student) {
        // 1. Lấy thẻ cần ôn tập
        List<StudentFlashcardProgress> reviewCards = progressRepository.findTodayReviewCards(student);

        // 2. Nếu chưa đủ 20 thẻ, thêm thẻ mới
        int remainingSlots = 20 - reviewCards.size();
        List<FlashCard> newCards = new ArrayList<>();

        if (remainingSlots > 0) {
            // ✅ FIX: Sử dụng Pageable thay vì PageRequest trực tiếp
            Pageable pageable = PageRequest.of(0, remainingSlots);
            newCards = flashcardRepository.findNewFlashcardsForStudent(student, pageable);
        }

        // 3. Kết hợp và trả về
        List<FlashCard> todayCards = new ArrayList<>();

        // Thêm thẻ ôn tập
        todayCards.addAll(reviewCards.stream()
                .map(StudentFlashcardProgress::getFlashcard)
                .toList());

        // Thêm thẻ mới vào danh sách
        todayCards.addAll(newCards);

        return todayCards;
    }

    /**
     * Xử lý khi student đánh giá độ khó của thẻ
     */
    public void rateFlashcard(User student, Integer flashcardId,
                              StudentFlashcardProgress.DifficultyRating rating) {

        FlashCard flashcard = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));

        // Tìm hoặc tạo progress record
        StudentFlashcardProgress progress = progressRepository
                .findByStudentAndFlashcard(student, flashcard)
                .orElse(new StudentFlashcardProgress());

        if (progress.getId() == null) {
            progress.setStudent(student);
            progress.setFlashcard(flashcard);
            // Set default values for new progress
            progress.setMasteryLevel(StudentFlashcardProgress.MasteryLevel.NEW);
            progress.setRepetitionCount(0);
            progress.setTotalReviews(0);
        }

        // Cập nhật progress dựa trên rating
        updateProgressByRating(progress, rating);

        // Lưu progress
        progressRepository.save(progress);

        // Cập nhật student progress tổng quan
        updateStudentOverallProgress(student);
    }

    private void updateProgressByRating(StudentFlashcardProgress progress,
                                        StudentFlashcardProgress.DifficultyRating rating) {

        progress.setLastDifficultyRating(rating);
        progress.setLastReviewed(LocalDateTime.now());
        progress.setTotalReviews(progress.getTotalReviews() + 1);
        progress.setRepetitionCount(progress.getRepetitionCount() + 1);

        // Tính toán next review date dựa trên rating
        LocalDateTime nextReview = calculateNextReviewDate(rating, progress.getRepetitionCount());
        progress.setNextReviewDate(nextReview);

        // Cập nhật mastery level
        updateMasteryLevel(progress, rating);
    }

    private LocalDateTime calculateNextReviewDate(StudentFlashcardProgress.DifficultyRating rating,
                                                  int repetitionCount) {
        LocalDateTime now = LocalDateTime.now();

        return switch (rating) {
            case EASY -> {
                // Dễ: interval tăng theo cấp số nhân
                int days = Math.min(30, (int) Math.pow(2, repetitionCount));
                yield now.plusDays(days);
            }
            case MEDIUM -> {
                // Trung bình: interval vừa phải
                int days = Math.min(14, repetitionCount * 2);
                yield now.plusDays(days);
            }
            case HARD -> {
                // Khó: lặp lại sớm
                yield now.plusDays(1);
            }
            case AGAIN -> {
                // Lại: xuất hiện ngay lập tức (trong session hiện tại)
                yield now.plusMinutes(10);
            }
        };
    }

    private void updateMasteryLevel(StudentFlashcardProgress progress,
                                    StudentFlashcardProgress.DifficultyRating rating) {

        int repetitions = progress.getRepetitionCount();

        // Logic chuyển đổi mastery level
        if (rating == StudentFlashcardProgress.DifficultyRating.EASY && repetitions >= 5) {
            progress.setMasteryLevel(StudentFlashcardProgress.MasteryLevel.MASTERED);
        } else if (repetitions >= 2) {
            progress.setMasteryLevel(StudentFlashcardProgress.MasteryLevel.REVIEW);
        } else if (repetitions >= 1) {
            progress.setMasteryLevel(StudentFlashcardProgress.MasteryLevel.LEARNING);
        } else {
            progress.setMasteryLevel(StudentFlashcardProgress.MasteryLevel.NEW);
        }
    }

    private void updateStudentOverallProgress(User student) {
        // ✅ FIX: Sử dụng enum thay vì String
        StudentProgress studentProgress = studentProgressRepository
                .findByStudentAndSkillType(student, StudentProgress.SkillProgressType.FLASHCARDS)
                .orElse(new StudentProgress());

        if (studentProgress.getId() == null) {
            studentProgress.setStudent(student);
            studentProgress.setSkillType(StudentProgress.SkillProgressType.FLASHCARDS);
            // Initialize default values
            studentProgress.setCurrentStudyStreak(0);
            studentProgress.setLongestStudyStreak(0);
            studentProgress.setTotalFlashcardsLearned(0);
        }

        // Cập nhật streak và total learned
        updateStudyStreak(studentProgress);
        studentProgress.setTotalFlashcardsLearned(studentProgress.getTotalFlashcardsLearned() + 1);

        studentProgressRepository.save(studentProgress);
    }

    private void updateStudyStreak(StudentProgress progress) {
        LocalDateTime today = LocalDateTime.now();
        LocalDateTime lastStudy = progress.getLastTestDate(); // Dùng tạm lastTestDate

        if (lastStudy == null || !lastStudy.toLocalDate().equals(today.toLocalDate())) {
            // Học lần đầu hôm nay
            if (lastStudy != null && lastStudy.toLocalDate().equals(today.toLocalDate().minusDays(1))) {
                // Học liên tiếp
                progress.setCurrentStudyStreak(progress.getCurrentStudyStreak() + 1);
            } else {
                // Bắt đầu streak mới
                progress.setCurrentStudyStreak(1);
            }

            // Cập nhật longest streak
            if (progress.getCurrentStudyStreak() > progress.getLongestStudyStreak()) {
                progress.setLongestStudyStreak(progress.getCurrentStudyStreak());
            }

            progress.setLastTestDate(today);
        }
    }

    // ===== STATISTICS =====

    public FlashcardStatistics getStudentStatistics(User student) {
        List<Object[]> masteryStats = progressRepository.countCardsByMasteryLevel(student);
        Optional<Double> accuracy = progressRepository.calculateAccuracy(student);

        // ✅ FIX: Sử dụng enum thay vì String
        StudentProgress progress = studentProgressRepository
                .findByStudentAndSkillType(student, StudentProgress.SkillProgressType.FLASHCARDS)
                .orElse(new StudentProgress());

        return FlashcardStatistics.builder()
                .currentStreak(progress.getCurrentStudyStreak() != null ? progress.getCurrentStudyStreak() : 0)
                .longestStreak(progress.getLongestStudyStreak() != null ? progress.getLongestStudyStreak() : 0)
                .totalLearned(progress.getTotalFlashcardsLearned() != null ? progress.getTotalFlashcardsLearned() : 0)
                .accuracy(accuracy.orElse(0.0))
                .masteryBreakdown(masteryStats)
                .build();
    }

    // ===== ADDITIONAL HELPER METHODS =====

    /**
     * Lấy tất cả flashcards của một user
     */
    public List<FlashCard> getFlashcardsByCreator(User creator) {
        return flashcardRepository.findByCreator(creator);
    }

    /**
     * Tìm kiếm flashcards theo keyword
     */
    public List<FlashCard> searchFlashcards(String keyword) {
        return flashcardRepository.searchByKeyword(keyword);
    }

    /**
     * Lấy progress của student cho một flashcard cụ thể
     */
    public Optional<StudentFlashcardProgress> getStudentProgress(User student, Integer flashcardId) {
        return flashcardRepository.findById(flashcardId)
                .flatMap(flashcard -> progressRepository.findByStudentAndFlashcard(student, flashcard));
    }

    /**
     * Đếm số flashcards theo từng set
     */
    public List<Object[]> getSetCounts() {
        return flashcardRepository.countCardsBySet();
    }

    /**
     * Xóa flashcard (soft delete)
     */
    public void deleteFlashcard(Integer flashcardId, User user) {
        FlashCard flashcard = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));

        // Chỉ creator hoặc admin mới có thể xóa
        if (!flashcard.getCreator().getId().equals(user.getId()) &&
                !user.getRole().equals("ADMIN") && !user.getRole().equals("ROLE_ADMIN")) {
            throw new RuntimeException("Unauthorized to delete this flashcard");
        }

        flashcard.setIsActive(false);
        flashcardRepository.save(flashcard);
    }

    /**
     * Cập nhật flashcard
     */
    public FlashCard updateFlashcard(Integer flashcardId, FlashCard updatedFlashcard, User user) {
        FlashCard existingFlashcard = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));

        // Chỉ creator hoặc admin mới có thể sửa
        if (!existingFlashcard.getCreator().getId().equals(user.getId()) &&
                !user.getRole().equals("ADMIN") && !user.getRole().equals("ROLE_ADMIN")) {
            throw new RuntimeException("Unauthorized to update this flashcard");
        }

        // Update fields
        existingFlashcard.setWord(updatedFlashcard.getWord());
        existingFlashcard.setMeaning(updatedFlashcard.getMeaning());
        existingFlashcard.setExampleSentence(updatedFlashcard.getExampleSentence());
        existingFlashcard.setContext(updatedFlashcard.getContext());
        existingFlashcard.setCategory(updatedFlashcard.getCategory());
        existingFlashcard.setPronunciation(updatedFlashcard.getPronunciation());
        existingFlashcard.setWordType(updatedFlashcard.getWordType());
        existingFlashcard.setSynonyms(updatedFlashcard.getSynonyms());
        existingFlashcard.setSetName(updatedFlashcard.getSetName());
        existingFlashcard.setIsPublic(updatedFlashcard.getIsPublic());
        existingFlashcard.setDifficultyLevel(updatedFlashcard.getDifficultyLevel());

        return flashcardRepository.save(existingFlashcard);
    }
}