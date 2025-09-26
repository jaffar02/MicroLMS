package com.jaffardev.MicroLMS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateAssignmentResponse {
    private String title;        // ← add
    private String description;
    private Integer maxMarks;
    private List<String> materials;
    private Long courseId;
    private LocalDateTime dueDate;
}