package com.musicsys.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 图片服务：动态封面/头像生成（PNG） + 缓存 + 外部URL下载。
 */
@Slf4j
@RestController
@RequestMapping("/images")
public class ImageController {

    @Value("${app.upload.path:./uploads}")
    private String uploadPath;

    private static final String[][] PALETTE = {
        {"#667eea", "#764ba2"}, {"#f093fb", "#f5576c"}, {"#4facfe", "#00f2fe"},
        {"#43e97b", "#38f9d7"}, {"#fa709a", "#fee140"}, {"#a18cd1", "#fbc2eb"},
        {"#fccb90", "#d57eeb"}, {"#e0c3fc", "#8ec5fc"}, {"#f5576c", "#ff6f00"},
        {"#30cfd0", "#330867"}, {"#a8edea", "#fed6e3"}, {"#5ee7df", "#b490ca"},
        {"#d299c2", "#fef9d7"}, {"#89f7fe", "#66a6ff"}, {"#fddb92", "#d1fdff"},
        {"#9890e3", "#b1f4cf"},
    };

    // ---- 封面 PNG (300x300) ----
    @GetMapping("/cover/{seed}")
    public ResponseEntity<byte[]> cover(@PathVariable String seed) throws IOException {
        Path cached = Paths.get(uploadPath, "generated", "cover", seed + ".png");
        if (Files.exists(cached)) {
            return servePng(Files.readAllBytes(cached));
        }
        byte[] png = generateCover(seed);
        saveToCache(cached, png);
        return servePng(png);
    }

    // ---- 头像 PNG (200x200) ----
    @GetMapping("/avatar/{seed}")
    public ResponseEntity<byte[]> avatar(@PathVariable String seed) throws IOException {
        Path cached = Paths.get(uploadPath, "generated", "avatar", seed + ".png");
        if (Files.exists(cached)) {
            return servePng(Files.readAllBytes(cached));
        }
        byte[] png = generateAvatar(seed);
        saveToCache(cached, png);
        return servePng(png);
    }

    // ---- 下载外部图片到本地 ----
    @PostMapping("/download")
    public ResponseEntity<?> download(@RequestParam String url,
                                       @RequestParam(defaultValue = "cover") String type) {
        try {
            String ext = extractExt(url);
            String fileName = UUID.randomUUID().toString() + ext;
            Path dir = Paths.get(uploadPath, type);
            Files.createDirectories(dir);
            Path target = dir.resolve(fileName);

            try (InputStream in = new URL(url).openStream()) {
                BufferedImage image = ImageIO.read(in);
                if (image == null) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("code", 400, "msg", "无法识别图片格式"));
                }
                ImageIO.write(image, ext.substring(1), target.toFile());
            }
            String localPath = "/uploads/" + type + "/" + fileName;
            log.info("图片下载成功: {} -> {}", url, localPath);
            return ResponseEntity.ok(Map.of("url", localPath));
        } catch (Exception e) {
            log.error("图片下载失败: {}", url, e);
            return ResponseEntity.badRequest()
                .body(Map.of("code", 400, "msg", "下载失败: " + e.getMessage()));
        }
    }

    // ==================== PNG 生成 ====================

    private byte[] generateCover(String seed) throws IOException {
        int idx = Math.abs(seed.hashCode()) % PALETTE.length;
        Color c1 = Color.decode(PALETTE[idx][0]);
        Color c2 = Color.decode(PALETTE[idx][1]);
        int w = 300, h = 300;

        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            // 圆角背景
            GradientPaint gp = new GradientPaint(0, 0, c1, w, h, c2);
            g.setPaint(gp);
            g.fill(new RoundRectangle2D.Double(0, 0, w, h, 24, 24));
            // 装饰圆环
            g.setStroke(new BasicStroke(3f));
            g.setColor(new Color(255, 255, 255, 80));
            g.drawOval(108, 60, 84, 84);
            // 中心小圆
            g.setColor(new Color(255, 255, 255, 100));
            g.fillOval(136, 88, 28, 28);
            // 音符线
            g.setStroke(new BasicStroke(4f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            g.drawLine(180, 70, 190, 52);
            g.drawLine(200, 60, 206, 48);
            // 文字
            String text = seed.length() > 6 ? seed.substring(0, 6) : seed;
            g.setFont(new Font("Microsoft YaHei", Font.PLAIN, 22));
            g.setColor(new Color(255, 255, 255, 180));
            FontMetrics fm = g.getFontMetrics();
            int tx = (w - fm.stringWidth(text)) / 2;
            g.drawString(text, tx, 230);
        } finally {
            g.dispose();
        }
        return toPng(img);
    }

    private byte[] generateAvatar(String seed) throws IOException {
        int idx = Math.abs(seed.hashCode()) % PALETTE.length;
        Color c1 = Color.decode(PALETTE[idx][0]);
        Color c2 = Color.decode(PALETTE[idx][1]);
        int w = 200, h = 200;
        int cx = w / 2, cy = h / 2;

        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            // 圆形剪裁
            Ellipse2D circle = new Ellipse2D.Double(0, 0, w, h);
            g.setClip(circle);
            GradientPaint gp = new GradientPaint(0, 0, c1, w, h, c2);
            g.setPaint(gp);
            g.fill(circle);
            // 上半圆装饰
            g.setColor(new Color(255, 255, 255, 50));
            g.fillOval(cx - 36, cy - 52, 72, 72);
            // 下半椭圆装饰
            g.setColor(new Color(255, 255, 255, 35));
            g.fillOval(cx - 58, cy + 28, 116, 72);
            // 首字母
            String initial = seed.isEmpty() ? "?" : seed.substring(0, 1).toUpperCase();
            g.setClip(null);
            g.setColor(new Color(255, 255, 255, 220));
            g.setFont(new Font("Microsoft YaHei", Font.BOLD, 48));
            FontMetrics fm = g.getFontMetrics();
            int tx = (w - fm.stringWidth(initial)) / 2;
            int ty = (h - fm.getHeight()) / 2 + fm.getAscent();
            g.drawString(initial, tx, ty);
        } finally {
            g.dispose();
        }
        return toPng(img);
    }

    // ==================== 工具方法 ====================

    private void saveToCache(Path path, byte[] data) {
        try {
            Files.createDirectories(path.getParent());
            Files.write(path, data);
        } catch (IOException e) {
            log.warn("图片缓存失败: {}", e.getMessage());
        }
    }

    private ResponseEntity<byte[]> servePng(byte[] data) {
        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_PNG)
            .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS))
            .body(data);
    }

    private byte[] toPng(BufferedImage img) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", bos);
        return bos.toByteArray();
    }

    private String extractExt(String url) {
        String path = url.contains("?") ? url.substring(0, url.indexOf("?")) : url;
        int dot = path.lastIndexOf('.');
        if (dot > 0 && dot < path.length() - 1) {
            String ext = path.substring(dot).toLowerCase();
            if (ext.matches("\\.(png|jpg|jpeg|gif|webp|bmp)")) return ext;
        }
        return ".jpg";
    }
}
