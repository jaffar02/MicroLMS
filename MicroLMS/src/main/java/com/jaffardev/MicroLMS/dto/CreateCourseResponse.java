package com.jaffardev.MicroLMS.dto;

import lombok.Data;

@Data
public class CreateCourseResponse {
    private Long id;
    private String title;
    private String description;
    private String inviteCode;
}
