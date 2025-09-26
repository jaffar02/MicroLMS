package com.jaffardev.MicroLMS.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateAssignmentRequest {
    private String title;        // ← add
    private String description;
    private Integer maxMarks;
    private List<String> materials;
    private Long courseId;
    private LocalDateTime dueDate;   // ← add (or LocalDateTime if time needed)
}