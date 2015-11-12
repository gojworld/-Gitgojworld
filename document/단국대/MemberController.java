package kr.dku.member.web;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import kr.dku.base.exception.BaseException;
import kr.dku.base.security.SecurityContextHelper;
import kr.dku.base.security.access.InvalidSessionException;
import kr.dku.base.security.access.annotation.Secured;
import kr.dku.base.security.access.annotation.SecurityPolicy;
import kr.dku.base.security.access.vote.PrivacyPolicyAgreementVoter;
import kr.dku.base.security.authentication.Authentication;
import kr.dku.base.security.authentication.AuthenticationFilter;
import kr.dku.base.security.authentication.AuthenticationRequestToken;
import kr.dku.base.security.authentication.AuthenticationSuccessHandler;
import kr.dku.base.security.authentication.AutoLogonAuthenticationRequestToken;
import kr.dku.base.security.authentication.SingleSignOnAuthenticationRequestToken;
import kr.dku.base.security.authentication.Staff4AuthenticationRequestToken;
import kr.dku.base.security.authentication.UserIdentity;
import kr.dku.base.security.authentication.UsernamePasswordAuthenticationRequestToken;
import kr.dku.base.security.authentication.logout.LogoutSuccessHandler;
import kr.dku.base.security.crypto.Crypto;
import kr.dku.base.security.web.WebAttributes;
import kr.dku.base.service.ServiceException;
import kr.dku.base.servlet.BaseController;
import kr.dku.base.servlet.WebException;
import kr.dku.base.servlet.view.BarcodeView;
import kr.dku.base.util.CamelCaseMap;
import kr.dku.base.util.WebUtils;
import kr.dku.base.util.XPlatformUtils;
import kr.dku.comm.syst.accm.domain.SysLoginHs;
import kr.dku.comm.syst.accm.service.AccmService;
import kr.dku.comm.syst.event.domain.CommMbEventPcptnLst;
import kr.dku.comm.syst.event.service.EventService;
import kr.dku.comm.syst.prsn.domain.PrsnListWrapper;
import kr.dku.comm.syst.prsn.service.PrsnService;
import kr.dku.member.domain.EmailUser;
import kr.dku.member.domain.Logon;
import kr.dku.member.domain.Verification;
import kr.dku.member.service.MemberService;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;
import org.codehaus.jackson.map.ObjectMapper;
import org.joda.time.DateTime;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.util.CookieGenerator;
import com.ksign.access.api.SSORspData;
import com.ksign.access.api.SSOService;
/**
 * 로그인 및 비밀번호 변경, 아이디/비밀번호 찾기, 개인정보활용 동의 등의 서비스를 처리
 *
 * @author 조용상
 * @version 1.0
 *
 *          <pre>
 * 수정일                수정자         수정내용
 * ---------------------------------------------------------------------
 * 2014-12-29            조용상         최초작성
 * </pre>
 */
@Controller
@RequestMapping(value = "/member")
public class MemberController extends BaseController implements AuthenticationSuccessHandler, LogoutSuccessHandler, InitializingBean {
	private final Logger logger = Logger.getLogger(this.getClass());

	/**
	 * 로그인 후 이동할 파라미터 명
	 */
	public static final String REDIRECT_URL_PARAMETER = "returnurl";

	/**
	 * 비밀번호 변경 기간이 되었는지 식별할 수 있는 Attribute name
	 */
	public static final String CHANGE_PASSWORD = "__change_password__";

	/**
	 * 본인인증을 통해 찾은 아이디를 저장하는 Attribute name
	 */
	public static final String CERT_ID = "__cert_id__";

	/**
	 * 인증코드발송 데이터를 저장하는 Attribute name
	 */
	public static final String VERIFICATION_DATA = "__verification_data__";

	/**
	 * 로그인 실패 카운트를 저장하는 Attribute name
	 */
	public static final String RETRY_COUNT = "__retry_count__";

	/**
	 * 로그인 후 이동할 기본 URL
	 */
	/* public static final String DEFAULT_AUTHENTICATION_SUCCESS_URL = "https://portal.dankook.ac.kr"; */
	/**
	 * 로그아웃 후 이동한 기본 URL
	 */
	public static final String DEFAULT_LOGOUT_SUCCESS_URL = "member/logoff.do";

	/**
	 * 기숙사 도메인
	 */
	public static final String[] DORMITORY_DOMAINS = new String[]{"domi.dankook.ac.kr", "chdomi.dankook.ac.kr"};

	/**
	 * 이메일 주소의 유효성 검사 정규 표현식
	 */
	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$");

	private MemberService memberService;

	private AccmService accmService;

	private PrsnService prsnService;

	private EventService eventService;

	@Autowired
	public void setMemberService(MemberService memberService) {
		this.memberService = memberService;
	}

	@Autowired
	public void setAccmService(AccmService accmService) {
		this.accmService = accmService;
	}

	@Autowired
	public void setPrsnService(PrsnService prsnService) {
		this.prsnService = prsnService;
	}

	@Autowired
	public void setEventService(EventService eventService) {
		this.eventService = eventService;
	}

	private String getDefaultAuthenticationSuccessUrl(HttpServletRequest request) {
		return (WebUtils.isRequestedMobile(request, true)) ? "main.do" : "https://portal.dankook.ac.kr";
	}

	@SuppressWarnings("serial")
	public static final Map<String, String[]> TITLES_MAP = new HashMap<String, String[]>() {
		{
			put("lbl.logon", new String[]{"logon.do"});
			put("lbl.logoff", new String[]{"logoff.do"});
			put("lbl.chgpwd", new String[]{"changePasswordForm.do"});
			put("lbl.prpc", new String[]{"privacyPolicyForm.do"});
			put("lbl.findid", new String[]{"findIdForm.do", "findEmailForm.do"});
			put("lbl.rstpwd", new String[]{"resetPasswordForm.do", "resetComplete.do"});
			put("lbl.joined", new String[]{"joinConfirmForm.do"});
			put("lbl.join", new String[]{"joinForm.do"});
		}
	};

	/**
	 * memberLayout.jsp 의 제목을 Model 객체에서 넣는다.
	 *
	 * @param request HTTP 요청 객체 HTTP 요청 객체
	 * @param locale 언어 정보
	 * @param model Mode 객체 Model 객체
	 */
	@ModelAttribute
	public void putTitle(HttpServletRequest request, Locale locale, Model model) {
		model.addAttribute("title", "");
		for (Map.Entry<String, String[]> title : TITLES_MAP.entrySet()) {
			for (String uri : title.getValue()) {
				if (request.getRequestURI().endsWith(uri)) {
					model.addAttribute("title", messageSource.getMessage(title.getKey(), null, locale));
					break;
				}
			}
		}
	}

	// =================================================> 로그인
	/**
	 * 로그인 화면 요청
	 *
	 * @param request HTTP 요청 객체
	 * @param model Mode 객체
	 * @return 로그인 화면
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/logon.do", method = RequestMethod.GET)
	public String logon(HttpServletRequest request, HttpServletResponse response, @CookieValue(value = "a", required = false) boolean autoLogon, @CookieValue(value = "id", required = false) String id, Model model) throws IOException {
		// TODO 운영서버 SSO 작업 완료 후 if (!"local".equals(config.getString("dev-env")) || config.getBoolean("sso-local-agent")) { 로 변경 --> done
		boolean logoned = false;
		if (!"local".equals(config.getString("dev-env")) || config.getBoolean("sso-local-agent")) {
			SSOService ssoService = SSOService.getInstance();
			SSORspData rspData = ssoService.ssoGetLoginData(request);
			logoned = (rspData != null && rspData.getResultCode() == 0);
		}
		// 로그인된 사용자가 기숙사에서 다시 로그인 화면으로 이동했을 경우 기숙사 메인 페이지로 이동
		if (SecurityContextHelper.getAuthentication(request) != null || logoned) {
			String referer = request.getHeader("Referer");
			if (StringUtils.isNotEmpty(referer)) {
				for (String dormitoryDomain : DORMITORY_DOMAINS) {
					if (referer.indexOf(dormitoryDomain) > -1) {
						response.sendRedirect("http://" + DORMITORY_DOMAINS[0]);
						return null;
					}
				}
			}
		}
		// 세션은 없지만 SSO Token이 있는 경우 SSO 로그인을 한다.
		if (SecurityContextHelper.getAuthentication(request) == null && logoned) {
			try {
				request.setAttribute(AuthenticationFilter.RAISE_EXCEPTION, true);
				request.getRequestDispatcher("/j_security_check").forward(request, response);
				if (logger.isDebugEnabled()) {
					logger.debug("sso token exists to login");
				}
			} catch (Exception e) {
				model.addAttribute("error", e.getMessage());
				return "member/logon";
			}
		} else if (SecurityContextHelper.getAuthentication(request) != null && logoned) {
			if (logger.isDebugEnabled()) {
				logger.debug("session exists to login");
			}
			// 세션도 있고 SSO Token도 있는 경우라면 defaultAuthenticationSuccessUrl로 리다렉트
			return resolveTitleModelHideRedirectUrl(buildRedirectUrl(request, getDefaultAuthenticationSuccessUrl(request)), model);
		} else if (autoLogon) {
			// 모바일 자동 로그인
			try {
				request.setAttribute(AutoLogonAuthenticationRequestToken.AUTO_LOGON_ATTR, autoLogon);
				request.setAttribute(AuthenticationFilter.RAISE_EXCEPTION, true);
				request.getRequestDispatcher("/j_security_check").forward(request, response);
			} catch (Exception e) {
				model.addAttribute("error", e.getMessage());
				return "member/logon";
			}
		} else {
			if (WebUtils.isRequestedXPlatform(request)) {
				throw new InvalidSessionException();
			}
		}
		/*
		 * request parameter, request scope, session scope, referer 에서 리다렉트 url을 찾고
		 * 만약 redirect url이 null 또는 dankook 도메인에 온 것이 아니라면 다른 곳에서
		 * 로그인 화면으로 온 것이므로 defaultAuthenticationSuccessUrl로 리다렉트 url을 지정
		 * referer 사용은 신중히 해야 함.
		 * 예상과는 다르게 전혀 어뚱한 곳으로 redirection할 수 있으므로 충분히 검증이 필요하고
		 * 현재는 referer를 사용하지 않게 설정
		 */
		String redirectUrl = buildRedirectUrl(request);
		if (redirectUrl == null || redirectUrl.indexOf("dankook") == -1) {
			redirectUrl = buildRedirectUrl(request, getDefaultAuthenticationSuccessUrl(request));
		}
		request.getSession().setAttribute(REDIRECT_URL_PARAMETER, redirectUrl);
		if (logger.isDebugEnabled()) {
			logger.debug("Redirect URL: " + redirectUrl);
		}
		model.addAttribute(new Logon());
		model.addAttribute("id", id);
		model.addAttribute("env", config.getString("dev-env"));
		return "member/logon";
	}

	/**
	 * 로그인 요청
	 *
	 * @param logon 로그인 정보
	 * @param request HTTP 요청 객체
	 * @param response HTTP 응답 객체
	 * @param model Mode 객체
	 * @return 로그인 실패 시 이동할 화면
	 * @throws Exception 로그인 에러의 경우
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = {"/logon.do", "/logonx.do"}, method = RequestMethod.POST)
	public String logon(Logon logon, HttpServletRequest request, HttpServletResponse response, Model model) {
		if (StringUtils.isNotEmpty(logon.getRedirectUrl())) {
			request.getSession().setAttribute(REDIRECT_URL_PARAMETER, logon.getRedirectUrl());
		}
		try {
			request.setAttribute(AuthenticationFilter.RAISE_EXCEPTION, true);
			request.setAttribute(UsernamePasswordAuthenticationRequestToken.USERNAME_PARAMETER, logon.getUsername());
			request.setAttribute(UsernamePasswordAuthenticationRequestToken.PASSWORD_PARAMETER, logon.getPassword());
			request.getRequestDispatcher("/j_security_check").forward(request, response);
		} catch (Exception e) {
			Object retry = request.getSession().getAttribute(RETRY_COUNT);
			int retryCount = (retry != null) ? (Integer)retry : 0;
			if (retryCount > 5) {
				memberService.exceedLogonRetry(logon.getUsername());
				request.getSession().setAttribute(RETRY_COUNT, 0);
			} else {
				request.getSession().setAttribute(RETRY_COUNT, ++retryCount);
			}
			if (WebUtils.isRequestedXPlatform(request)) {
				XPlatformUtils.sendErrorMessage(response, e.getMessage(), BaseException.DEFAULT_ERROR_CODE);
			} else {
				model.addAttribute("error", e.getMessage());
				return "member/logon";
			}
		}
		return null;
	}

	/**
	 * Staff4 로그인 화면 요청
	 *
	 * @param request HTTP 요청 객체
	 * @param model Mode 객체
	 * @return 로그인 화면
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/logon4Staff.do", method = RequestMethod.GET)
	public String logon4Staff(Logon logon, Model model) {
		model.addAttribute("title", "Staff 로그인");
		return "member/logon4Staff";
	}

	/**
	 * Staff4 로그인 요청
	 *
	 * @param logon 로그인 정보
	 * @param request HTTP 요청 객체
	 * @param response HTTP 응답 객체
	 * @param model Mode 객체
	 * @return 로그인 실패 시 이동할 화면
	 * @throws Exception 로그인 에러의 경우
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/logon4Staff.do", method = RequestMethod.POST)
	public String logon4Staff(Logon logon, HttpServletRequest request, HttpServletResponse response, Model model) {
		model.addAttribute("title", "Staff 로그인");
		String viewName = logon(logon, request, response, model);
		if (StringUtils.isNotEmpty(viewName)) {
			return "member/logon4Staff";
		}
		return null;
	}

	/*
	 * (non-Javadoc)
	 * @see kr.dku.base.security.authentication.AuthenticationSuccessHandler#onAuthenticationSuccess(javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse, kr.dku.base.security.authentication.Authentication)
	 */
	@Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication, AuthenticationRequestToken authRequestToken) throws IOException, ServletException {
		try {
			SysLoginHs sysLoginHs = new SysLoginHs();
			if (authRequestToken instanceof Staff4AuthenticationRequestToken) {
				Staff4AuthenticationRequestToken staff4AuthRequestToken = (Staff4AuthenticationRequestToken)authRequestToken;
				sysLoginHs.setInputUid(staff4AuthRequestToken.getUserIdentity().getId());
			} else {
				sysLoginHs.setInputUid(authentication.getUserId());
			}
			accmService.insertSysLoginHs(sysLoginHs);
		} catch (Exception e) {
			logger.error(e);
		}
		try {
			if (WebUtils.isRequestedMobile(request, true)) { //모바일 경우
				// 모바일 이벤트
				List<CamelCaseMap> progMddEventList = eventService.findProgMddEventList();
				CommMbEventPcptnLst commMbEventPcptnLst;
				if (!CollectionUtils.isEmpty(progMddEventList)) {
					for (CamelCaseMap progMddEvent : progMddEventList) {
						commMbEventPcptnLst = new CommMbEventPcptnLst();
						commMbEventPcptnLst.setEventSeq(progMddEvent.getInt("eventSeq"));
						commMbEventPcptnLst.setIntgUid(SecurityContextHelper.getUserDetails().getIntgUid());
						eventService.saveCommMbEventPcptnLst(commMbEventPcptnLst);
					}
				}
				// 모바일 자동로그인 쿠기저장
				UserIdentity userIdentity = authRequestToken.getUserIdentity();
				String platformType = StringUtils.isNotEmpty(request.getParameter("_platformType")) ? request.getParameter("_platformType") : getCookie(request, "t");
				String deviceToken = StringUtils.isNotEmpty(request.getParameter("_deviceToken")) ? request.getParameter("_deviceToken") : getCookie(request, "d");
				// 모바일 디바이스 토큰 없데이트
				if (StringUtils.isNotEmpty(platformType) && StringUtils.isNotEmpty(deviceToken)) {
					if ("true".equals(request.getParameter("autoLogon"))) {
						addCookie(response, "a", "true");
						addCookie(response, "t", platformType);
						addCookie(response, "d", deviceToken);
						addCookie(response, "i", userIdentity.getId());
						addCookie(response, "p", Crypto.encSEED(userIdentity.getPassword()));
					}
					memberService.saveDeviceToken(SecurityContextHelper.getUserDetails().getAcctInfoId(), platformType, deviceToken);
				}
				if ("true".equals(request.getParameter("idSave"))) {
					addCookie(response, "id", userIdentity.getId());
				} else if (!"true".equals(getCookie(request, "a"))) {
					removeCookie(response, "id");
				}
			}
		} catch (Exception e) {
			logger.error(e);
		}
		String redirectUrl = (authRequestToken instanceof Staff4AuthenticationRequestToken) ? buildRedirectUrl(request, "main.do") : buildRedirectUrl(request);
		boolean tokenGenerated = false;
		if (!(authRequestToken instanceof SingleSignOnAuthenticationRequestToken)) {
			// TODO 운영서버에는 당분간 개인정보활용 동의 및 패스워드 변경 안 함. 그리고 staff4 로그인의 경우에도 skip.
			// !"production".equals(config.getString("dev-env")) &&
			if (!(authRequestToken instanceof Staff4AuthenticationRequestToken)) {
				// Guest 계정은 개인정보활용 동의 및 패스워드 변경 안 함.
				if (!SecurityContextHelper.getUserDetails().getIntlUserYn().equals("0")) {
					CamelCaseMap privacyPolicy = memberService.checkPrivacyPolicy(authentication.getUserId(), config.getInt("pwd-change-period"));
					/*
					 * XPlatform에서 직접 로그인 한 경우 개인정보 동의하는 곳으로
					 * redirect를 하지 않으므로 아래 기능을 사용하지 않는다.
					 */
					if (privacyPolicy.getInt("ppua") > 0 && WebUtils.isRequestedWebBrowser(request) && !WebUtils.isRequestedMobile(request, true)) {
						if (privacyPolicy.getInt("man") > 0) {
							request.getSession().setAttribute(PrivacyPolicyAgreementVoter.PRIVACY_POLICY_AGREEMENT, Boolean.FALSE);
						}
						redirectUrl = buildRedirectUrl(request, "member/privacyPolicyForm.do");
					}
					/*
					 * 개인 정보 보호 정책 및 이용 동의를 하지 않은 경우.
					 * 먼저 개인 정보 보호 정책 및 이용 동의 화면으로 이동하고
					 * 개인 정보 보호 정책 및 이용 동의를 한 후 비밀번호 변경 화면으로
					 * 이동하기 위해 CHANGE_PASSWORD을 세션에 넣어 활용한다.
					 */
					if (privacyPolicy.getInt("pcc") < 0) {
						if (redirectUrl == null) {
							redirectUrl = buildRedirectUrl(request, "member/changePasswordForm.do");
						} else {
							request.getSession().setAttribute(CHANGE_PASSWORD, Boolean.TRUE);
						}
					}
				}
			}
			// Guest 계정은 SSO Token 생성하지 않음
			Boolean skipSsoToken = (request.getAttribute(AuthenticationFilter.SKIP_SSO_TOKEN) != null) ? (Boolean)request.getAttribute(AuthenticationFilter.SKIP_SSO_TOKEN) : Boolean.FALSE;
			logger.debug("################## skipSsoToken: " + skipSsoToken);
			if (!skipSsoToken) {
				// TODO 추후 운영서버 SSO 구축 후에는 !"local".equals(config.getString("dev-env") 로 변경 --> done
				if ((WebUtils.isRequestedWebBrowser(request) && !"local".equals(config.getString("dev-env"))) || (WebUtils.isRequestedWebBrowser(request) && config.getBoolean("sso-local-agent"))) {
					SSOService ssoService = SSOService.getInstance();
					SSORspData rspData = ssoService.ssoGetLoginData(request);
					if (rspData != null && rspData.getResultCode() == -1) {
						String intgUid = authentication.getUserId();
						String remoteAddr = getRemoteAddr(request);
						String additionalToken = getAdditionalToken(intgUid, authRequestToken.getUserIdentity().getPassword());
						tokenGenerated = true;
						rspData = ssoService.ssoReqIssueToken(request, response, "form-based", intgUid, additionalToken, redirectUrl, remoteAddr, remoteAddr);
						// TODO 자체 로그인 수행 페이지가 필요 할 듯.....
						if (rspData != null && rspData.getResultCode() == -1) {
							throw new WebException("사용자 인증토큰 요청정보 생성에 실패 하였습니다. 시스템 자체 로그인을 수행합니다.");
						}
					}
				}
			}
		}
		if (!tokenGenerated) {
			if (WebUtils.isRequestedXPlatform(request)) {
				XPlatformUtils.sendErrorMessage(response, "Success", 1);
			} else {
				response.sendRedirect(redirectUrl);
			}
		}
		request.getSession().removeAttribute(RETRY_COUNT);
		request.getSession().removeAttribute(REDIRECT_URL_PARAMETER);
	}

	private CookieGenerator cookieGenerator = new CookieGenerator();

	@Override
	public void afterPropertiesSet() throws Exception {
		cookieGenerator.setCookieDomain(".dankook.ac.kr");
		cookieGenerator.setCookiePath("/");
		cookieGenerator.setCookieMaxAge(365 * 24 * 60 * 60);
	}

	private void addCookie(HttpServletResponse response, String name, String value) {
		logger.debug("S################## name: " + name + ", value: " + value);
		cookieGenerator.setCookieName(name);
		cookieGenerator.addCookie(response, value);
		logger.debug("E################## name: " + name + ", value: " + value);
		// Cookie cookie = new Cookie(name, value);
		// cookie.setDomain("dankook.ac.kr");
		// cookie.setPath("/");
		// cookie.setMaxAge(365 * 24 * 60 * 60); // 365일
		// response.addCookie(cookie);
	}

	private String getCookie(HttpServletRequest request, String name) {
		Cookie[] cookies = request.getCookies();
		if (cookies != null && cookies.length > 0) {
			for (Cookie cookie : cookies) {
				if (name.equals(cookie.getName())) {
					return cookie.getValue();
				}
			}
		}
		return null;
	}

	/**
	 * SSO Token 생성시 추가적인 Token 정보를 가져온다.
	 *
	 * @param intgUid 로그인 사용자 아이디
	 * @param userName 로그인 사용자 이름
	 * @return SSO Token String
	 */
	private String getAdditionalToken(String intgUid, String password) {
		Map<String, Object> additionalTokenMap = memberService.findAdditionalToken(intgUid, password);
		StringBuilder tokens = new StringBuilder();
		if (additionalTokenMap != null && additionalTokenMap.size() > 0) {
			for (Map.Entry<String, Object> additionalToken : additionalTokenMap.entrySet()) {
				tokens.append(additionalToken.getKey()).append("=").append(additionalToken.getValue() == null ? "" : additionalToken.getValue()).append("$");
			}
		}
		return tokens.toString();
	}

	// =================================================> 로그아웃
	/**
	 * 로그아웃
	 *
	 * @return 로그아웃 화면
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/logoff.do")
	public String logoff() {
		return "member/logoff";
	}

	/*
	 * (non-Javadoc)
	 * @see kr.dku.base.security.authentication.logout.LogoutSuccessHandler#onLogoutSuccess(javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse, kr.dku.base.security.authentication.Authentication)
	 */
	@Override
	public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
		removeCookie(response, "p", "a", "i");
		String redirectUrl = (StringUtils.isEmpty(request.getParameter(REDIRECT_URL_PARAMETER))) ? buildRedirectUrl(request, DEFAULT_LOGOUT_SUCCESS_URL) : request.getParameter(REDIRECT_URL_PARAMETER);
		// TODO 추후 운영서버 SSO 구축 후에는 !"local".equals(config.getString("dev-env") 로 변경 --> done
		if ((WebUtils.isRequestedWebBrowser(request) && !"local".equals(config.getString("dev-env"))) || (WebUtils.isRequestedWebBrowser(request) && config.getBoolean("sso-local-agent"))) {
			String ssoServer = SSOService.getInstance().getServerScheme();
			response.sendRedirect(ssoServer + "/sso/pmi-logout-url.jsp?returl=" + redirectUrl);
		} else {
			response.sendRedirect(redirectUrl);
		}
	}

	private void removeCookie(HttpServletResponse response, String ...names) {
		for (String name : names) {
			Cookie cookie = new Cookie(name, null);
			cookie.setDomain(".dankook.ac.kr");
			cookie.setPath("/");
			cookie.setMaxAge(0);
			response.addCookie(cookie);
		}
	}

	// =================================================> 개인 정보 보호 정책 및 이용 동의
	/**
	 * 개인정보활용 동의 화면
	 *
	 * @param model Mode 객체
	 * @return 개인정보활용 동의 화면
	 */
	@Secured(policy = SecurityPolicy.SESSION)
	@RequestMapping(value = PrivacyPolicyAgreementVoter.PRIVACY_POLICY_URL, method = RequestMethod.GET)
	public String privacyPolicyForm(Model model) {
		String userType = SecurityContextHelper.getUserDetails().getUserTyCd();
		String intgUid = SecurityContextHelper.getUserDetails().getIntgUid();
		model.addAttribute("privacyPolicyList", prsnService.findUtilAgrListByUserTyCd(userType, intgUid));
		return "member/privacyPolicyForm";
	}

	/**
	 * 개인정보활용 동의 저장
	 *
	 * @param listWrapper
	 * @param request HTTP 요청 객체
	 * @param model Mode 객체
	 * @return 개인정보활용 동의 저장 이동할 화면
	 */
	@Secured(policy = SecurityPolicy.SESSION)
	@RequestMapping(value = PrivacyPolicyAgreementVoter.PRIVACY_POLICY_URL, method = RequestMethod.POST)
	public String privacyPolicyForm(PrsnListWrapper listWrapper, HttpServletRequest request, Model model) {
		prsnService.insertUtilAgr(listWrapper.getUtilAgrList());
		request.getSession().setAttribute(PrivacyPolicyAgreementVoter.PRIVACY_POLICY_AGREEMENT, Boolean.TRUE);
		String redirectUrl = null;
		Object changePassword = request.getSession().getAttribute(CHANGE_PASSWORD);
		if (changePassword != null && ((Boolean)changePassword) == Boolean.TRUE) {
			redirectUrl = buildRedirectUrl(request, "member/changePasswordForm.do");
		} else {
			redirectUrl = buildRedirectUrl(request);
		}
		return resolveTitleModelHideRedirectUrl(redirectUrl, model);
	}

	// =================================================> 아이디 찾기: 단국인
	/**
	 * 아이디 찾기 화면 (단국인)
	 *
	 * @param session HTTPSession 객체
	 * @return 아이디 찾기 화면 (단국인)
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/findIdForm.do", method = RequestMethod.GET)
	public String findIdForm(HttpSession session) {
		removeCertificationData(session);
		session.removeAttribute(WebAttributes.NICE_CERT_DATA);
		return "member/findIdForm";
	}

	/**
	 * NICE본인인증 결과 값에 해당하는 계정 목록을 조회하여 model에 넣는다.
	 * NICE본인인증 결과 값에 해당하는 계정 목록이 한 건의 경우 아이디를
	 * session에 입력하고 여러건의 경우에는 아이디를 mask 처리한다.
	 *
	 * @param session HTTPSession 객체
	 * @param locale 언어 정보
	 * @param model Mode 객체
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/findAccountListByNiceCert.do")
	public void findAccountListByNiceCert(HttpSession session, Locale locale, Model model) {
		// NICE 인증없이 테스트할 경우..
		// Map<String, String> niceData = putCertData(session);
		if (session.getAttribute(WebAttributes.NICE_CERT_DATA) == null) {
			throw new WebException(messageSource, "lbl.comm.nice.not.run");
		} else {
			@SuppressWarnings("unchecked")
			Map<String, String> niceData = (Map<String, String>)session.getAttribute(WebAttributes.NICE_CERT_DATA);
			List<CamelCaseMap> accountList = memberService.findAccountListByNiceCert(niceData);
			String message = null;
			Object[] args = null;
			if (CollectionUtils.isEmpty(accountList)) {
				args = new String[]{niceData.get("NAME"), niceData.get("BIRTHDATE"), niceData.get("GENDER_NM"), niceData.get("NATIONALINFO_NM")};
				message = messageSource.getMessage("lbl.findid.result.no", args, locale);
			} else if (accountList.size() == 1) {
				// 비밀번호 재설정을 위해 인증된 아이디를 세션에 넣어 놓는다.
				setCertificationId(session, accountList.get(0).getString("intgUid"));
				model.addAttribute("accountList", accountList);
				args = new Object[]{accountList.get(0).getString("intgUid")};
				message = messageSource.getMessage("lbl.findid.result.one", args, locale);
			} else {
				// 아이디가 여러건인 경우 마스크 처리
				List<CamelCaseMap> maskedAccountList = new ArrayList<CamelCaseMap>(accountList.size());
				StringBuilder maskedIntgUid = new StringBuilder();
				String intgUid = null;
				for (CamelCaseMap account : accountList) {
					intgUid = (String)account.get("intgUid");
					maskedIntgUid.append(intgUid.substring(0, 2));
					for (int i = 0; i < intgUid.length() - 2; i++) {
						maskedIntgUid.append("*");
					}
					account.put("INTG_UID", maskedIntgUid.toString());
					maskedAccountList.add(account);
					maskedIntgUid.setLength(0);
				}
				model.addAttribute("accountList", maskedAccountList);
				args = new Object[]{niceData.get("NAME"), niceData.get("BIRTHDATE"), niceData.get("GENDER_NM"), niceData.get("NATIONALINFO_NM"), maskedAccountList.size()};
				message = messageSource.getMessage("lbl.findid.result.many", args, locale);
			}
			model.addAttribute("niceData", niceData);
			model.addAttribute("message", message);
		}
	}

	/**
	 * NICE본인인증 결과에 의한 계정이 여러개일 경우 사용자가 선택한 계정과
	 * 주민번호 뒤 4자리 값이 일치하는지의 여부를 판단한 후 일치하는 경우
	 * 사용자가 선택한 아이디를 session에 입력한다.
	 *
	 * @param index 사용자가 선택한 아이디의 인덱스
	 * @param rrn 주민번호 뒤 4자리
	 * @param session HTTPSession 객체
	 * @param locale 언어 정보
	 * @param model Mode 객체
	 */
	@SuppressWarnings("unchecked")
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/matchesRrn.do")
	public void matchesRrn(int index, String rrn, HttpSession session, Locale locale, Model model) {
		Object niceData = session.getAttribute(WebAttributes.NICE_CERT_DATA);
		if (niceData == null) {
			throw new WebException(messageSource, "nice.null");
		}
		String intgUid = memberService.matchesRrn((Map<String, String>)niceData, index, rrn);
		if (StringUtils.isNotEmpty(intgUid)) {
			// 비밀번호 재설정을 위해 인증된 아이디를 세션에 넣어 놓는다.
			setCertificationId(session, intgUid);
		}
		model.addAttribute("message", messageSource.getMessage("lbl.findid.found", new String[]{intgUid}, locale));
		model.addAttribute("intgUid", intgUid);
	}

	// =================================================> 아이디 찾기: 이메일
	/**
	 * 아이디 찾기 화면(이메일)
	 *
	 * @param session HTTPSession 객체
	 * @return 아이디 찾기 화면(이메일)
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/findEmailForm.do", method = RequestMethod.GET)
	public String findEmailForm(HttpSession session) {
		return "member/findEmailForm";
	}

	/**
	 * 사용자가 입력한 성명에 해당하는 계정목록을 조회하고
	 * 이메일 주소를 mask 처리하여 model에 넣는다.
	 *
	 * @param name 사용자 성명
	 * @param model Mode 객체
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/findEmailAccountListByName.do")
	public void findEmailAccountListByName(String name, Model model) {
		List<CamelCaseMap> accountList = memberService.findEmailAccountListByName(name);
		if (CollectionUtils.isEmpty(accountList)) {
			throw new WebException(messageSource, "lbl.findem.result.no", new String[]{name});
		} else {
			// 마스크 처리
			List<CamelCaseMap> maskedAccountList = new ArrayList<CamelCaseMap>(accountList.size());
			StringBuilder maskedIntgUid = new StringBuilder();
			Matcher matcher = null;
			String intgUid = null;
			for (CamelCaseMap account : accountList) {
				intgUid = (String)account.get("intgUid");
				matcher = EMAIL_PATTERN.matcher(intgUid);
				if (matcher.matches()) {
					String emailId = intgUid.substring(0, intgUid.indexOf("@"));
					maskedIntgUid.append(emailId.substring(0, 2));
					for (int i = 0; i < emailId.length() - 2; i++) {
						maskedIntgUid.append("*");
					}
					maskedIntgUid.append(intgUid.substring(intgUid.indexOf("@")));
					account.put("VALID", Boolean.TRUE);
				} else {
					maskedIntgUid.append(intgUid.substring(0, 2));
					for (int i = 0; i < intgUid.length() - 2; i++) {
						maskedIntgUid.append("*");
					}
					account.put("VALID", Boolean.FALSE);
				}
				account.put("INTG_UID", maskedIntgUid.toString());
				maskedIntgUid.setLength(0);
				maskedAccountList.add(account);
			}
			model.addAttribute("accountList", maskedAccountList);
		}
	}

	// =================================================> 회원 가입확인: 이메일
	/**
	 * 이메일 회원 가입확인 화면
	 *
	 * @return 이메일 회원 가입확인 화면
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/joinConfirmForm.do", method = RequestMethod.GET)
	public String joinConfirmForm() {
		return "member/joinConfirmForm";
	}

	/**
	 * 이메일 회원 가입확인 요청
	 *
	 * @param intgUid 사용자 아이디(이메일)
	 * @param name 사용자 성명
	 * @param model Mode 객체
	 * @return 가입여부에 따른 결과 메시지
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/joinConfirmForm.do", method = RequestMethod.POST)
	public String joinConfirmForm(String intgUid, String name, Locale locale, Model model) {
		if (memberService.joined(intgUid, name)) {
			model.addAttribute("message", messageSource.getMessage("lbl.joined.exist", null, locale));
		} else {
			model.addAttribute("message", messageSource.getMessage("lbl.joined.not.exist", null, locale));
		}
		return "member/joinConfirmForm";
	}

	// =================================================> 비밀번호 재설정
	/**
	 * 비밀번호 재설정 화면
	 * 로그인이 되어있는 상태에서 본 화면으로 이동할 경우
	 * 비밀번호 변경 화면으로 이동한다.
	 *
	 * @param model Mode 객체
	 * @return 비밀번호 재설정 화면
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/resetPasswordForm.do", method = RequestMethod.GET)
	public String resetPasswordForm(String type, @RequestParam(required = false, defaultValue = "") String returnurl, HttpSession session, Model model) {
		/*
		 * 로그인 사용자가 해당 페이지로 와서 비밀번호를 재설정하면 안 됨.
		 * 로그인 사용자는 비밀번호 변경을 통해 비밀번호 변경
		 */
		if (SecurityContextHelper.getAuthentication() != null) {
			return resolveTitleModelHideRedirectUrl("changePasswordForm.do?returnurl=" + returnurl, model);
		}
		session.removeAttribute(WebAttributes.NICE_CERT_DATA);
		return type.equals("dku") ? "member/resetPasswordForDKUForm" : "member/resetPasswordForEmailForm";
	}

	/**
	 * 비밀번호 재설정 요청
	 * 비밀번호 재설정을 하려면 본인인증/이메일인증이 반드시 필요하므로
	 * session에 CERT_ID가 있는지 확인하고 session에 담긴 CERT_ID를 기반으로
	 * 비밀번호를 재설정한다.
	 *
	 * @param password 비밀번호
	 * @param request HTTP 요청 객체
	 * @param model Mode 객체
	 * @return
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/resetPasswordForm.do", method = RequestMethod.POST)
	public String resetPasswordForm(String password, @RequestParam(required = false, defaultValue = "") String returnurl, HttpServletRequest request, Model model) {
		// 인증을 안 받았는데 악의적으로 파라미터를 날릴 경우..
		assertCertificationId(request);
		String intgUid = getCertificationId(request);
		String ip = getRemoteAddr(request);
		memberService.resetPassword(intgUid, password, ip);
		return resolveTitleModelHideRedirectUrl("resetComplete.do?returnurl=" + returnurl, model);
	}

	/**
	 * 요청된 사용자가 아이디가 통합계정이 존재하는지 여부를 판단한다.
	 *
	 * @param intgUid 사용자 아이디
	 * @param model Mode 객체
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/joined.do")
	public void joined(String intgUid, Model model) {
		model.addAttribute("result", memberService.joined(intgUid));
	}

	/**
	 * NICE본인인증 수행 후 사용자가 입력한 아이디가 본인인증 결과 값에
	 * 존재하는지 여부를 판단 후 존재한다면 아이디를 session에 CERT_ID attribute 이름으로 저장한다.
	 *
	 * @param intgUid 사용자 아이디
	 * @param session HTTPSession 객체
	 * @param model Mode 객체
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/verifyAccount.do")
	public void verifyAccount(String intgUid, HttpSession session, Locale locale, Model model) {
		// NICE 인증없이 테스트할 경우.. 31880366
		// Map<String, String> niceData = putCertData(session);
		@SuppressWarnings("unchecked")
		Map<String, String> niceData = (Map<String, String>)session.getAttribute(WebAttributes.NICE_CERT_DATA);
		if (niceData == null) {
			throw new WebException(messageSource, "nice.null");
		}
		String message = null;
		boolean result = memberService.verifyAccount(intgUid, niceData);
		if (result) {
			setCertificationId(session, intgUid);
			message = messageSource.getMessage("rstpwd.nice.match", null, locale);
		} else {
			String[] args = new String[]{niceData.get("NAME"), niceData.get("BIRTHDATE"), intgUid};
			message = messageSource.getMessage("rstpwd.nice.mismatch", args, locale);
		}
		model.addAttribute("result", result);
		model.addAttribute("message", message);
	}

	/**
	 * 비밀번호 재설정 완료 화면
	 *
	 * @param session HTTPSession 객체
	 * @param model Mode 객체
	 * @return 비밀번호 재설정 완료 화면
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/resetComplete.do", method = RequestMethod.GET)
	public String resetComplete(HttpSession session, Model model) {
		removeCertificationData(session);
		return "member/resetComplete";
	}

	// =================================================> 비밀번호 변경
	/**
	 * 비밀번호 변경 화면
	 *
	 * @param model Mode 객체
	 * @return 비밀번호 변경 화면
	 */
	@Secured(policy = SecurityPolicy.SESSION)
	@RequestMapping(value = "/changePasswordForm.do", method = RequestMethod.GET)
	public String changePasswordForm(Model model) {
		CamelCaseMap recentChangesPassword = memberService.findRecentChangesPassword(SecurityContextHelper.getUserDetails().getIntgUid());
		model.addAttribute("recentChangesPassword", recentChangesPassword);
		return "member/changePasswordForm";
	}

	/**
	 * 비밀번호 변경 요청
	 *
	 * @param oldPassword 기존 비밀번호
	 * @param newPassword 신규 비밀번호
	 * @param request HTTP 요청 객체
	 * @param model Mode 객체
	 * @return 비밀번호 변경 완료 후 이동할 화면
	 */
	@Secured(policy = SecurityPolicy.SESSION)
	@RequestMapping(value = "/changePasswordForm.do", method = RequestMethod.POST)
	public String changePasswordForm(String oldPassword, String newPassword, HttpServletRequest request, Model model) {
		try {
			String intgUid = SecurityContextHelper.getUserDetails().getIntgUid();
			memberService.updatePassword(intgUid, oldPassword, newPassword, getRemoteAddr(request));
		} catch (Exception e) {
			if (e instanceof ServiceException) {
				model.addAttribute("error", e.getMessage());
				return "member/changePasswordForm";
			}
			throw e;
		}
		return resolveTitleModelHideRedirectUrl(buildRedirectUrl(request), model);
	}

	/**
	 * 비밀번호 나중에 변경
	 *
	 * @param request HTTP 요청 객체
	 * @param model Mode 객체
	 * @return 비밀번호 나중에 변경 후 이동할 화면
	 */
	@Secured(policy = SecurityPolicy.SESSION)
	@RequestMapping(value = "/passwordChageLater.do")
	public String passwordChageLater(HttpServletRequest request, Model model) {
		String intgUid = SecurityContextHelper.getUserDetails().getIntgUid();
		memberService.passwordChageLater(intgUid, getRemoteAddr(request));
		return resolveTitleModelHideRedirectUrl(buildRedirectUrl(request), model);
	}

	// =================================================> 이메일 회원 가입
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/joinForm.do")
	public String joinForm(String step, HttpSession session, Model model) {
		switch (step) {
			case "valification" :
				removeCertificationData(session);
				return "member/joinValificationForm";
			case "agreement" :
				// 이메일 인증을 받지않고 본 페이지로 이동하지 못 함
				assertCertificationId(session);
				model.addAttribute("privacyPolicyList", prsnService.findUtilAgrListByUserTyCd("2501", getCertificationId(session)));
				return "member/joinAgreementForm";
			case "done" :
				// 이메일 인증을 받지않고 본 페이지로 이동하지 못 함
				assertCertificationId(session);
				model.addAttribute("intgUid", getCertificationId(session));
				removeCertificationData(session);
				return "member/joinDone";
			default :
				throw new WebException(messageSource, "illegal.access");
		}
	}

	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/join.do")
	public String join(EmailUser user, HttpServletRequest request, Model model) {
		assertCertificationId(request);
		user.setIntgUid(getCertificationId(request));
		memberService.join(user);
		return resolveTitleModelHideRedirectUrl("joinForm.do?step=done", model);
	}

	// =================================================> 이메일 인증 코드
	/**
	 * 사용자가 선택한 이메일 주소를 대상으로 이메일 인증코드를 발송하고
	 * 검증객체를 session 및 model에 넣는다.
	 *
	 * @param name 사용자 성명
	 * @param index 사용자가 선택한 이메일 주소 인덱스
	 * @param session HTTPSession 객체
	 * @param model Mode 객체
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/sendVerificationCode.do")
	public void sendVerificationCode(String name, int index, HttpSession session, Model model) {
		// 이메일 인증없이 테스트 시
		// Verification verification = new Verification("chotire@gmail.com", "1234567", 1);
		Verification verification = memberService.sendVerificationCode(name, index);
		session.setAttribute(VERIFICATION_DATA, verification);
		model.addAttribute("verification", verification);
	}

	/**
	 * 사용자가 입력 또는 이메일 주소가 완벽하게 노출된(unmask) 이메일 주소를 대상으로
	 * 이메일 인증코드를 발송하고 검증객체를 session 및 model에 넣는다.
	 *
	 * @param email 이메일
	 * @param session HTTPSession 객체
	 * @param model Mode 객체
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/sendVerificationCode.do", params = {"email"})
	public void sendVerificationCode(String email, HttpSession session, Model model) {
		Verification verification = memberService.sendVerificationCode(email);
		session.setAttribute(VERIFICATION_DATA, verification);
		model.addAttribute("verification", verification);
	}

	/**
	 * 이메일 인증코드를 검증한다.
	 *
	 * @param code 이메일 인증코드
	 * @param session HTTPSession 객체
	 * @param model Mode 객체
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/validateCode.do")
	public void validateCode(String code, HttpSession session, Locale locale, Model model) {
		if (session.getAttribute(VERIFICATION_DATA) == null) {
			throw new WebException(messageSource, "findem.code.not.found");
		} else {
			Verification verification = (Verification)session.getAttribute(VERIFICATION_DATA);
			DateTime now = new DateTime();
			if (now.isBefore(verification.getVerificationEndTime().getMillis())) {
				if (!code.equals(verification.getVerificationCode())) {
					throw new WebException(messageSource, "findem.code.mismatch");
				}
				setCertificationId(session, verification.getEmail());
				model.addAttribute("email", verification.getEmail());
			} else {
				throw new WebException(messageSource, "findem.code.timeout");
			}
		}
	}

	// =================================================> 서울대학교 인권센터 로그인
	/**
	 * 서울대학교 인권센터 로그인
	 *
	 * @param userid 사용자 아이디
	 * @param passwd 비밀번호
	 * @param request 요청객체
	 * @param response 응답객체
	 * @return 인증 결과 스트링(JSON)
	 * @throws Exception
	 */
	@Secured(policy = SecurityPolicy.IGNORE)
	@RequestMapping(value = "/signin.do", method = RequestMethod.POST, produces = "application/json; charset=utf-8")
	@ResponseBody
	public String signin(String userid, String passwd, HttpServletRequest request, HttpServletResponse response) throws Exception {
		String remoteAddr = request.getHeader("CLIENT-IP") != null ? request.getHeader("CLIENT-IP") : request.getRemoteAddr();
		if (remoteAddr.equals("147.47.106.215") || remoteAddr.equals("147.47.106.218")) {
			Map<String, Object> userInfo = memberService.authenticateForHumanRights(userid, passwd);
			userInfo.put("result", MapUtils.isNotEmpty(userInfo) ? "success" : "fail");
			ObjectMapper objectMapper = new ObjectMapper();
			return objectMapper.writeValueAsString(userInfo);
		}
		return null;
	}

	// =================================================> Redirection
	/**
	 * @param request HTTP 요청 객체
	 * @return
	 */
	private String buildRedirectUrl(HttpServletRequest request) {
		return buildRedirectUrl(request, null, false);
	}

	@SuppressWarnings("serial")
	private static final Set<String> LOCAL_PASS_DOMAIN_PREFIX = new HashSet<String>() {
		{
			add("portal");
		}
	};

	/**
	 * @param request HTTP 요청 객체
	 * @param path
	 * @return
	 */
	private String buildRedirectUrl(HttpServletRequest request, String path) {
		return buildRedirectUrl(request, path, false);
	}

	/**
	 * Redirection 주소를 생성한다.
	 * Redirection 주소는 REDIRECT_URL_PARAMETER 상수 값에 해당하는
	 * 파라미터가 있는지 다음으로 request 영역에, session 영역에 있는지 순서대로
	 * 판단을하고 없다면 DEFAULT_AUTHENTICATION_SUCCESS_URL 에 지정된 곳으로
	 * Redirection 주소를 생성한다.
	 *
	 * @param request HTTP 요청 객체
	 * @param path url 주소
	 * @param useReferer HTTP Header 내의 referer를 사용할지 여부
	 * @return Redirection 주소
	 */
	private String buildRedirectUrl(HttpServletRequest request, String path, boolean useReferer) {
		String redirectUrl = null;
		if (WebUtils.isRequestedWebBrowser(request)) {
			if (path == null) {
				if (request.getParameter(REDIRECT_URL_PARAMETER) != null) {
					redirectUrl = request.getParameter(REDIRECT_URL_PARAMETER);
					if (logger.isDebugEnabled()) {
						logger.debug("Param: " + redirectUrl);
					}
				} else if (request.getAttribute(REDIRECT_URL_PARAMETER) != null) {
					redirectUrl = request.getAttribute(REDIRECT_URL_PARAMETER).toString();
					if (logger.isDebugEnabled()) {
						logger.debug("Attr: " + redirectUrl);
					}
				} else if (request.getSession().getAttribute(REDIRECT_URL_PARAMETER) != null) {
					redirectUrl = request.getSession().getAttribute(REDIRECT_URL_PARAMETER).toString();
					if (logger.isDebugEnabled()) {
						logger.debug("Session: " + redirectUrl);
					}
				} else {
					redirectUrl = determineUrl(request, getDefaultAuthenticationSuccessUrl(request));
				}
			} else {
				redirectUrl = determineUrl(request, path);
			}
		}
		return redirectUrl;
	}

	/**
	 * Redirection 주소를 생성를 할 때 WAS가 구동되는 환경이
	 * 개발자 로컬인지 개발서버인지 또는 운영서버인지에 판단을 하고
	 * 각가 환경에 따라 적절한 주소를 생성한다.
	 *
	 * @param request HTTP 요청 객체
	 * @param path url 주소
	 * @return 개발환경에 따른 주소
	 */
	private String determineUrl(HttpServletRequest request, String path) {
		String redirectUrl = null;
		String scheme = request.getHeader("x-schema") != null ? request.getHeader("x-schema") : request.getScheme();
		int port = scheme.equals("https") ? 443 : request.getServerPort();
		StringBuilder resultUrl = new StringBuilder();
		resultUrl.append(scheme).append("://").append(request.getServerName()).append(":").append(port).append(request.getContextPath()).append("/");
		if (path.startsWith("http")) {
			switch (config.getString("dev-env")) {
				case "local" :
					for (String prefix : LOCAL_PASS_DOMAIN_PREFIX) {
						if (path.indexOf(prefix) > -1) {
							resultUrl.append("main.do");
							return resultUrl.toString();
						}
					}
					redirectUrl = path;
					break;
				case "staging" :
					try {
						URL url = new URL(path);
						String host = url.getHost();
						String[] hostSplit = host.split("\\.");
						resultUrl.setLength(0);
						resultUrl.append("http://").append(hostSplit[0]).append("d").append(".").append(hostSplit[1]).append(".").append(hostSplit[2]).append(".").append(hostSplit[3]).append(":").append(80).append(url.getPath());
						redirectUrl = resultUrl.toString();
					} catch (MalformedURLException e) {
						throw new WebException(e.getMessage(), e);
					}
					break;
				default :
					redirectUrl = path;
					break;
			}
		} else {
			redirectUrl = resultUrl.append(path).toString();
		}
		return redirectUrl;
	}

	/**
	 * memeberLayout.jsp의 제목을 위해 @ModelAttribute를 사용하기 때문에
	 * Redirection을 할 때 제목에 URL에 파라미터로 붙어서 나간다.
	 * 이를 제거하기 위한 utility
	 *
	 * @param url url 주소
	 * @param model Mode 객체
	 * @return title을 제거한 redirection 주소
	 */
	private String resolveTitleModelHideRedirectUrl(String url, Model model) {
		model.asMap().remove("title");
		return "redirect:" + url;
	}

	// =================================================> Utilities
	/**
	 * Client 아이피를 얻는다.
	 *
	 * @param request
	 *            HTTP 요청 객체
	 * @return Client 아이피
	 */
	private String getRemoteAddr(HttpServletRequest request) {
		return request.getHeader("CLIENT-IP") != null ? request.getHeader("CLIENT-IP") : request.getRemoteAddr().startsWith("0:") ? "127.0.0.1" : request.getRemoteAddr();
	}

	/**
	 * NICE본인인증을 수행하면 테스트를 진행하는 것은 매우 번거로운 일이므로
	 * NICE본인인증을 수행한 것처럼 결과를 만들기 위한 utility 메소드.
	 *
	 * @param session
	 *            HTTPSession 객체
	 * @return NICE본인인증 데이터
	 */
	@SuppressWarnings("unused")
	private Map<String, String> putCertData(HttpSession session) {
		// NICE 인증없이 테스트할 경우..
		@SuppressWarnings("serial")
		Map<String, String> niceData = new HashMap<String, String>() {
			{
				put("NAME", "조용상");
				put("BIRTHDATE", "19751011");
				put("GENDER_X", "0001");
				put("NATIONALINFO_X", "1");
				put("GENDER_NM", "남");
				put("NATIONALINFO_NM", "내국인");
			}
		};
		session.setAttribute(WebAttributes.NICE_CERT, true);
		session.setAttribute(WebAttributes.NICE_CERT_DATA, niceData);
		return niceData;
	}

	private String getCertificationId(HttpServletRequest request) {
		return getCertificationId(request.getSession());
	}

	private String getCertificationId(HttpSession session) {
		return (String)session.getAttribute(CERT_ID);
	}

	private void setCertificationId(HttpSession session, String intgUid) {
		session.setAttribute(CERT_ID, intgUid);
	}

	private void removeCertificationData(HttpSession session) {
		session.removeAttribute(WebAttributes.NICE_CERT);
		session.removeAttribute(WebAttributes.NICE_CERT_DATA);
		session.removeAttribute(CERT_ID);
		session.removeAttribute(VERIFICATION_DATA);
	}

	private void assertCertificationId(HttpServletRequest request) {
		assertCertificationId(request.getSession());
	}

	private void assertCertificationId(HttpSession session) {
		if (session.getAttribute(CERT_ID) == null) {
			throw new WebException(messageSource, "rstpwd.not.cert");
		}
	}

	/**
	 * 모바일전용
	 * 사용자 박코드이미지
	 */
	@Secured(policy = SecurityPolicy.SESSION)
	@RequestMapping(value = "/userBarcodeImage.do")
	public ModelAndView userBarcodeImage() throws Exception {
		return new ModelAndView(new BarcodeView());
	}

	/**
	 * 모바일전용
	 * 사용자 신분증화면
	 */
	@Secured(policy = SecurityPolicy.SESSION)
	@RequestMapping(value = "/userIdcrd.do")
	public String userIdcrd(Model model) {
		model.addAttribute("memberPhoto", memberService.findMemberPhoto(SecurityContextHelper.getUserDetails().getAcctInfoId()));
		return "member/userIdcrd";
	}
}