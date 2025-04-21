package tungdao.com.project1.Controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class MyController {
    @GetMapping("/data")
    public String getData() {
        return "Xin chào từ Spring Boot!";
    }

    @PostMapping("/data")
    public String postData(@RequestBody String data) {
        return "Dữ liệu nhận được: " + data;
    }
}