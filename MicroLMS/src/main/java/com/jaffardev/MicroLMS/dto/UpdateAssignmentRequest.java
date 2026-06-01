package com.jaffardev.MicroLMS.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateAssignmentRequest {
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private Integer maxMarks;
}