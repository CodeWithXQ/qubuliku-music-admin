package com.musicsys.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("song_copyright")
public class SongCopyright {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long songId;
    private String lyricAuthor;
    private String composer;
    private String copyrightCompany;
    private LocalDate licenseStart;
    private LocalDate licenseEnd;
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
