package com.musicsys.common.constant;

import java.util.Map;

public final class Constants {

    private Constants() {}

    /** 歌曲审核状态 — 对齐前端 AuditStatusMap */
    public static final Map<Integer, String> AUDIT_STATUS = Map.of(
            0, "待审核",
            1, "审核通过",
            2, "已驳回",
            3, "已上架",
            4, "已下架"
    );

    /** 歌单状态 */
    public static final Map<Integer, String> PLAYLIST_STATUS = Map.of(
            0, "待审核",
            1, "已发布",
            2, "已驳回",
            3, "已下架"
    );

    /** 歌手认证状态 */
    public static final Map<Integer, String> SINGER_CERT_STATUS = Map.of(
            0, "入驻中",
            1, "待认证",
            2, "已认证"
    );

    /** 版权状态 */
    public static final Map<Integer, String> COPYRIGHT_STATUS = Map.of(
            0, "待录入",
            1, "已授权",
            2, "即将到期",
            3, "已过期"
    );

    /** 用户类型 */
    public static final Map<Integer, String> USER_TYPE = Map.of(
            0, "普通用户",
            1, "VIP会员",
            2, "音乐人"
    );

    /** 用户状态 */
    public static final Map<Integer, String> USER_STATUS = Map.of(
            0, "已禁用",
            1, "正常",
            2, "待激活"
    );

    /** 歌单类型 */
    public static final Map<Integer, String> PLAYLIST_TYPE = Map.of(
            0, "官方歌单",
            1, "用户歌单"
    );

    /** 操作类型 */
    public static final Map<String, String> OP_TYPE = Map.of(
            "ADD", "新增",
            "EDIT", "编辑",
            "DELETE", "删除",
            "LOGIN", "登录",
            "AUDIT", "审核",
            "EXPORT", "导出"
    );
}
