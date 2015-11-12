package kr.dku.comm.syst.main.web;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import kr.dku.base.convert.XMLParser;
import kr.dku.base.security.SecurityContextHelper;
import kr.dku.base.security.access.annotation.Secured;
import kr.dku.base.security.access.annotation.SecurityPolicy;
import kr.dku.base.security.authentication.Authentication;
import kr.dku.base.security.authentication.UserDetails;
import kr.dku.base.servlet.BaseController;
import kr.dku.base.util.CamelCaseMap;
import kr.dku.base.util.WebUtils;
import kr.dku.comm.syst.accm.service.AccmService;
import kr.dku.comm.syst.cdmg.domain.CommCdDet;
import kr.dku.comm.syst.cdmg.service.CodeService;
import kr.dku.comm.syst.cdmg.web.CommCodeDataSearch;
import kr.dku.comm.syst.main.service.WebMainService;
import kr.dku.comm.syst.pgmm.service.MenuService;
import kr.dku.comm.syst.pgmm.web.MenuSearch;
import kr.dku.comm.syst.util.service.UtilService;
import org.apache.commons.collections.MapUtils;
import org.codehaus.jackson.map.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
@Controller
public class WebMainController extends BaseController {
	private MenuService menuService;

	private AccmService accmService;

	private UtilService utilService;

	private WebMainService mainService;

	private CodeService codeService;

	@Autowired
	public void setCodeService(CodeService codeService) {
		this.codeService = codeService;
	}

	@Autowired
	public void setMenuService(MenuService menuService) {
		this.menuService = menuService;
	}

	@Autowired
	public void setAccmService(AccmService accmService) {
		this.accmService = accmService;
	}

	@Autowired
	public void setUtilService(UtilService utilService) {
		this.utilService = utilService;
	}

	@Autowired
	public void setWebMainService(WebMainService mainService) {
		this.mainService = mainService;
	}

	@Secured(policy = SecurityPolicy.SESSION)
	@RequestMapping("/main.do")
	public String main(HttpServletRequest request, Model model) {
		UserDetails userDetails = SecurityContextHelper.getUserDetails();
		String intgUid = userDetails.getIntgUid();
		int userTyCls = userDetails.getUserTyCls();
		if (!WebUtils.isRequestedMobile(request)) {
			model.addAttribute("receivedMessageList", mainService.findReceivedMessageList(intgUid));
			model.addAttribute("surveyList", mainService.findSurveyList(intgUid));
			model.addAttribute("employee", (userTyCls >= 20 && userTyCls < 30)); // 교직원 구분
		} else {// 도메인이 모바일일경우 별도 서비스
				// 포탈공지
			model.addAttribute("ptalAnncList", mainService.findPtalAnncList("1033"));
			// 학사공지
			model.addAttribute("bachAnncList", mainService.findPtalAnncList("1096"));
			// 장학공지
			model.addAttribute("schlrAnncList", mainService.findPtalAnncList("1044"));
			// 모바일 VOC 현황정보
			model.addAttribute("myVocCnt", mainService.findMyVocCnt(intgUid));
			// 모바일 스마트 알림
			model.addAttribute("commSmsRcvDscCnt", mainService.findCommSmsRcvDscCnt(intgUid));
			if (userDetails.getUserTyCd().matches("^(1101|1102)$")) {
				// 학생상담
				model.addAttribute("stdtCuslDscCnt", mainService.findStdtCuslDscCnt(intgUid));
			} else if (userDetails.getUserTyCd().matches("^(1301)$")) {
				// 교수상담
				model.addAttribute("profCuslDscCnt", mainService.findProfCuslDscCnt(intgUid));
			} else {
				// 도서정보
				try {
					List<CamelCaseMap> librInfoList = new XMLParser("http://lib.dankook.ac.kr/openapi/myloan?verb=info&uid=" + intgUid).createEntity(CamelCaseMap.class, "result");
					if (librInfoList.size() > 0) {
						CamelCaseMap librInfo = librInfoList.get(0);
						librInfo.put("overduecount", librInfo.getInt("overduecount"));
						librInfo.put("loancount", librInfo.getInt("loancount"));
						librInfo.put("reservecount", librInfo.getInt("reservecount"));
						model.addAttribute("librInfo", librInfo);
					}
				} catch (Exception e) {
					model.addAttribute("librInfo", new HashMap<String, Object>());
				}
			}
		}
		return "main";
	}

	@Secured(policy = SecurityPolicy.SESSION)
	@RequestMapping("/findMenu.do")
	public void findMenu(HttpSession session, HttpServletRequest req, Locale locale, Model model) {
		String language = locale.getLanguage().toUpperCase();
		Authentication authentication = SecurityContextHelper.getAuthentication(req);
		CamelCaseMap startWithMap = utilService.getStartWith(req.getServerName());
		String startWith = null;
		String scrnTyCd = null;
		if (MapUtils.isEmpty(startWithMap)) {
			startWith = "2000000000";
			scrnTyCd = "11";
		} else {
			startWith = startWithMap.getString("startWith");
			scrnTyCd = startWithMap.getString("scrnTyCd");
		}
		if (!authentication.isDelegated()) {
			model.addAttribute("menuList", menuService.findFrameMenuList(startWith, scrnTyCd, language));
		} else {
			MenuSearch menuSearch = new MenuSearch();
			menuSearch.setMenuId(startWith);
			menuSearch.setLocale(language);
			menuSearch.setScrnTyCd(scrnTyCd);
			model.addAttribute("menuList", menuService.findTrsfrMenuList(menuSearch));
		}
	}

	@Secured(policy = SecurityPolicy.SESSION)
	@RequestMapping("/findWebMultiIndentList.do")
	public void findWebMultiIndentList(Model model) {
		model.addAttribute("multiIndentList", accmService.findWebMultiIndentList());
	}

	@Secured(policy = SecurityPolicy.SESSION)
	@RequestMapping("/findLectureScheduleList.do")
	public void findLectureScheduleList(Model model) {
		UserDetails userDetails = SecurityContextHelper.getUserDetails();
		boolean student = userDetails.getUserTyCls() == 10;
		model.addAttribute("scheduleList", mainService.findLectureScheduleList(userDetails.getIntgUid(), student));
		model.addAttribute("student", student);
	}

	/**
	 * @Method Name : findMbVerInfo
	 * @작성일 : 2015. 9. 18.
	 * @작성자 : SYWORKS 박영조SP
	 * @변경이력 :
	 * @Method 설명 : 모바일 안드로이드/아이폰 버전정보
	 * @param res
	 * @param model
	 * @return
	 * @throws Exception
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@ResponseBody
	@RequestMapping(value = "/findMbVerInfo.do", produces = "application/json; charset=utf-8")
	public String findMbVerInfo(HttpServletResponse res, Model model) throws Exception {
		CommCodeDataSearch codeDataSearch = new CommCodeDataSearch();
		codeDataSearch.setCmnCdId("MB_VER_INFO");
		List<CommCdDet> commCodeDataList = codeService.findCommCodeDataList(codeDataSearch);
		Map<String, Object> info = new HashMap<String, Object>();
		Map<String, Object> mobInfo;
		for (CommCdDet commCdDet : commCodeDataList) {
			mobInfo = new HashMap<String, Object>();
			mobInfo.put("version", commCdDet.getUserInfoValu1());
			mobInfo.put("marketUrl", commCdDet.getUserInfoValu2());
			info.put(commCdDet.getCmnCdvalNm(), mobInfo);
		}
		return new ObjectMapper().writeValueAsString(info);
	}

	/**
	 * @Method Name : findDomiKey
	 * @작성일 : 2015. 9. 30.
	 * @작성자 : SYWORKS 박영조SP
	 * @변경이력 :
	 * @Method 설명 : 기숙사연결 암호화방식
	 * @param res
	 * @param model
	 * @return
	 * @throws Exception
	 */
	@Secured(policy = SecurityPolicy.SESSION)
	@ResponseBody
	@RequestMapping(value = "/findDomiKey.do", produces = "application/json; charset=utf-8")
	public String findDomiKey(HttpServletResponse res, Model model) throws Exception {
		Map<String, Object> info = new HashMap<String, Object>();
		info.put("key", encrypt("hakbyun=" + SecurityContextHelper.getUserDetails().getIntgUid() + "&logintime=" + new SimpleDateFormat("yyyyMMddHHmm").format(new Date()).toString()));
		return new ObjectMapper().writeValueAsString(info);
	}

	/**
	 * @Method Name : encrypt
	 * @작성일 : 2015. 9. 30.
	 * @작성자 : SYWORKS 박영조SP
	 * @변경이력 :
	 * @Method 설명 : 기숙사연결 암호화방식 AES 방식의 암호화
	 * @param message
	 * @return
	 * @throws Exception
	 */
	public static String encrypt(String message) throws Exception {
		String key = new SimpleDateFormat("MMdd").format(new Date()).toString() + "klsadjflDSa!";
		SecretKeySpec skeySpec = new SecretKeySpec(key.getBytes(), "AES");
		Cipher cipher = Cipher.getInstance("AES");
		cipher.init(Cipher.ENCRYPT_MODE, skeySpec);
		byte[] encrypted = cipher.doFinal(message.getBytes());
		return new SimpleDateFormat("MMdd").format(new Date()).toString() + byteArrayToHex(encrypted);
	}

	/**
	 * @Method Name : byteArrayToHex
	 * @작성일 : 2015. 9. 30.
	 * @작성자 : SYWORKS 박영조SP
	 * @변경이력 :
	 * @Method 설명 : 기숙사연결 암호화방식 unsigned byte(바이트) 배열을 16진수 문자열로 바꾼다.
	 * @param ba
	 * @return
	 */
	public static String byteArrayToHex(byte[] ba) {
		if (ba == null || ba.length == 0) {
			return null;
		}
		StringBuffer sb = new StringBuffer(ba.length * 2);
		String hexNumber;
		for (int x = 0; x < ba.length; x++) {
			hexNumber = "0" + Integer.toHexString(0xff & ba[x]);
			sb.append(hexNumber.substring(hexNumber.length() - 2));
		}
		return sb.toString();
	}
}