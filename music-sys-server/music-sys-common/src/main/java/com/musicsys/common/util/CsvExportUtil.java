package com.musicsys.common.util;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.function.Function;

/**
 * CSV 导出工具：将任意实体列表转为可下载的 CSV 文件（UTF-8 BOM，Excel 兼容）。
 */
public final class CsvExportUtil {

    private CsvExportUtil() {}

    /** 返回 ResponseEntity<byte[]> 供 Controller 直接返回给浏览器下载 */
    public static <T> ResponseEntity<byte[]> export(
            String filename,
            String[] headers,
            List<T> rows,
            Function<T, Object[]> rowMapper) {

        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        // UTF-8 BOM — 让 Excel 正确识别中文
        bos.write(0xEF);
        bos.write(0xBB);
        bos.write(0xBF);

        try (OutputStreamWriter w = new OutputStreamWriter(bos, StandardCharsets.UTF_8)) {
            // 表头
            w.write(String.join(",", quoteEach(headers)) + "\n");
            // 数据行
            for (T row : rows) {
                Object[] values = rowMapper.apply(row);
                w.write(toCsvLine(values) + "\n");
            }
            w.flush();
        } catch (Exception e) {
            throw new RuntimeException("CSV export failed", e);
        }

        byte[] bytes = bos.toByteArray();
        String encodedName = java.net.URLEncoder.encode(filename, StandardCharsets.UTF_8)
            .replace("+", "%20");

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename*=UTF-8''" + encodedName)
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .body(bytes);
    }

    private static String toCsvLine(Object[] values) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(csvEscape(values[i]));
        }
        return sb.toString();
    }

    private static String csvEscape(Object val) {
        if (val == null) return "";
        String s = val.toString();
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    private static String[] quoteEach(String[] headers) {
        String[] result = new String[headers.length];
        for (int i = 0; i < headers.length; i++) {
            result[i] = "\"" + headers[i].replace("\"", "\"\"") + "\"";
        }
        return result;
    }
}
