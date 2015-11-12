package kr.dku.base.util;

import javax.servlet.http.HttpServletRequest;

import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * @author 조용상
 * @version 1.0
 * <pre>
 * 수정일                수정자         수정내용
 * ---------------------------------------------------------------------
 * </pre>
 */
public class WebUtils {
	public static boolean isRequestedWebBrowser() {
        ServletRequestAttributes sra = (ServletRequestAttributes)RequestContextHolder.currentRequestAttributes();
        HttpServletRequest request = sra.getRequest();
        return isRequestedWebBrowser(request);
	}

	public static boolean isRequestedWebBrowser(HttpServletRequest request) {
        return !isRequestedXPlatform(request);
	}

	public static boolean isRequestedMobile() {
        ServletRequestAttributes sra = (ServletRequestAttributes)RequestContextHolder.currentRequestAttributes();
        HttpServletRequest request = sra.getRequest();
        return isRequestedMobile(request);
	}

	public static boolean isRequestedMobile(HttpServletRequest request) {
	    return isRequestedMobile(request, false);
	}

    public static boolean isRequestedMobile(HttpServletRequest request, boolean deviceDetect) {
//        if (deviceDetect) {
//            Device device = DeviceUtils.getCurrentDevice(request);
//            return (request.getServerName().startsWith("m.") || request.getServerName().startsWith("md.")) && device.isMobile();
//        }
        return request.getServerName().startsWith("m.") || request.getServerName().startsWith("md.");
    }

	public static boolean isRequestedXPlatform() {
        ServletRequestAttributes sra = (ServletRequestAttributes)RequestContextHolder.currentRequestAttributes();
        HttpServletRequest request = sra.getRequest();
        return isRequestedXPlatform(request);
	}

	public static boolean isRequestedXPlatform(HttpServletRequest request) {
        return XPlatformUtils.isXPlatformUserAgent(request);
	}

	public static String getRemoteAddr() {
        ServletRequestAttributes sra = (ServletRequestAttributes)RequestContextHolder.currentRequestAttributes();
        HttpServletRequest request = sra.getRequest();
		return getRemoteAddr(request);
	}

	public static String getRemoteAddr(HttpServletRequest request) {
		return request.getHeader("CLIENT-IP") != null ? request.getHeader("CLIENT-IP") :
			request.getRemoteAddr().startsWith("0:") ? "127.0.0.1" : request.getRemoteAddr();
	}
}