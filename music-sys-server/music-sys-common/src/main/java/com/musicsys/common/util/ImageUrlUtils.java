package com.musicsys.common.util;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 图片URL转换工具：将 api.dicebear.com 的外部URL转换为本地 /images/ 端点URL，
 * 解决国内网络无法访问 dicebear 导致图片显示失败的问题。
 */
public final class ImageUrlUtils {

    private static final Pattern DICEBEAR_PATTERN =
        Pattern.compile("https?://api\\.dicebear\\.com/[^/]+/(\\w+)/svg\\?.*seed=([^&]+)", Pattern.CASE_INSENSITIVE);

    private ImageUrlUtils() {}

    /**
     * 转换单个图片URL，将 dicebear 外部URL转为本地端点URL。
     * data URI、本地路径、空值均保持原样。
     */
    public static String resolve(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return imageUrl;
        }
        // data URI 不依赖网络，保持原样
        if (imageUrl.startsWith("data:")) {
            return imageUrl;
        }
        // 已是本地路径
        if (imageUrl.startsWith("/uploads/") || imageUrl.startsWith("/images/")) {
            return imageUrl;
        }
        // 尝试匹配 dicebear URL
        Matcher m = DICEBEAR_PATTERN.matcher(imageUrl);
        if (m.find()) {
            String type = m.group(1).toLowerCase();  // initials / shapes / rings
            String seed = decodeSeed(m.group(2));
            if (seed.isEmpty()) {
                return imageUrl;
            }
            // initials → 头像端点, shapes/rings → 封面端点
            String encoded = URLEncoder.encode(seed, StandardCharsets.UTF_8)
                .replace("+", "%20");  // URLEncoder 会把空格编码为 +，改为 %20 更符合路径规范
            if ("initials".equals(type)) {
                return "/images/avatar/" + encoded;
            }
            return "/images/cover/" + encoded;
        }
        // 其他外部URL保持原样（让浏览器自行加载，可能有网络问题，但不做无差别代理）
        return imageUrl;
    }

    private static String decodeSeed(String raw) {
        try {
            return URLDecoder.decode(raw, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return raw;
        }
    }
}
