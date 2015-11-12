package controller;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
@Controller
public class TestContoller2 {
	@RequestMapping(value = "/test2.do")
	public String test() {
		return "test2";
	}
}