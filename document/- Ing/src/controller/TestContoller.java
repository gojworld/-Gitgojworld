package controller;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
@Controller
public class TestContoller {
	@RequestMapping(value = "/test.do")
	public String test() {
		return "test";
	}
}