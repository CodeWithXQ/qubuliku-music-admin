package com.musicsys.model.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PlaylistQuery extends PageQuery {
    private String type;
    private String category;
    private String status;
}
