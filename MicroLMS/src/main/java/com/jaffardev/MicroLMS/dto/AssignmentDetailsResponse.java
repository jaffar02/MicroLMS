package com.jaffardev.MicroLMS.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AssignmentDetailsResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private Integer maxMarks;
    private List<String> materials;
    private Long courseId;

    private List<AssignmentSubmissionResponse> submissions;
}