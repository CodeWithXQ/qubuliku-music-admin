package com.musicsys.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class SongAuditDto {
    /** 批量审核时的ID列表（单曲审核时可空，由路径参数 {id} 提供） */
    private List<Long> ids;

    @NotBlank(message = "审核动作不能为空")
    private String action;

    private String remark;
}
