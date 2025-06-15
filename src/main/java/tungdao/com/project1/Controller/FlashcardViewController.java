package tungdao.com.project1.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import tungdao.com.project1.dto.FlashcardStatistics;  // ✅ IMPORT ĐÚNG
import tungdao.com.project1.entity.FlashCard;
import tungdao.com.project1.entity.User;
import tungdao.com.project1.service.FlashcardService;

import java.util.List;

@Controller
@RequestMapping("/flashcards")
@RequiredArgsConstructor
public class FlashcardViewController {

    private final FlashcardService flashcardService;

    @GetMapping
    public String flashcardHome(Model model, @AuthenticationPrincipal User user) {
        if (user != null) {
            // ✅ SỬA: Sử dụng FlashcardStatistics trực tiếp
            FlashcardStatistics stats = flashcardService.getStudentStatistics(user);
            model.addAttribute("statistics", stats);
        }

        // Lấy danh sách sets
        List<String> sets = flashcardService.getAllSetNames();
        model.addAttribute("sets", sets);

        return "flashcards/home";
    }

    @GetMapping("/study")
    public String studyPage(Model model, @AuthenticationPrincipal User user) {
        if (user == null) {
            return "redirect:/login";
        }

        // Lấy thẻ cần học hôm nay
        List<FlashCard> todayCards = flashcardService.getTodayStudyCards(user);
        model.addAttribute("flashcards", todayCards);

        return "flashcards/study";
    }

    @GetMapping("/sets/{setName}")
    public String viewSet(@PathVariable String setName, Model model) {
        List<FlashCard> flashcards = flashcardService.getFlashcardsBySet(setName);
        model.addAttribute("setName", setName);
        model.addAttribute("flashcards", flashcards);

        return "flashcards/set-view";
    }

    @GetMapping("/create")
    public String createFlashcardPage(Model model, @AuthenticationPrincipal User user) {
        if (user == null) {
            return "redirect:/login";
        }

        model.addAttribute("flashcard", new FlashCard());
        model.addAttribute("sets", flashcardService.getAllSetNames());

        return "flashcards/create";
    }

    // ===== ADDITIONAL VIEW ENDPOINTS =====

    @GetMapping("/statistics")
    public String statisticsPage(Model model, @AuthenticationPrincipal User user) {
        if (user == null) {
            return "redirect:/login";
        }

        FlashcardStatistics stats = flashcardService.getStudentStatistics(user);
        model.addAttribute("statistics", stats);

        return "flashcards/statistics";
    }

    @GetMapping("/sets")
    public String setsListPage(Model model) {
        List<String> sets = flashcardService.getAllSetNames();
        model.addAttribute("sets", sets);

        // Thống kê số thẻ trong mỗi set
        List<Object[]> setCounts = flashcardService.getSetCounts();
        model.addAttribute("setCounts", setCounts);

        return "flashcards/sets";
    }

    @GetMapping("/my-cards")
    public String myCardsPage(Model model, @AuthenticationPrincipal User user) {
        if (user == null) {
            return "redirect:/login";
        }

        List<FlashCard> myCards = flashcardService.getFlashcardsByCreator(user);
        model.addAttribute("flashcards", myCards);

        return "flashcards/my-cards";
    }
}