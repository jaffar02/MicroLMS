package com.jaffardev.MicroLMS.dto;

import lombok.Data;

@Data
public class UnenrollRequest {
    private Long courseId;
    private String studentEmail;
}