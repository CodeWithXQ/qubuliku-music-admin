package com.musicsys.model.vo;

import com.musicsys.model.entity.Song;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SongVo extends Song {
    /** 歌手姓名 (JOIN singer.name) */
    private String singerName;
}
