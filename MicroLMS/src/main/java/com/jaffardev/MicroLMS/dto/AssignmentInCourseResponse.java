package com.jaffardev.MicroLMS.dto;

import com.jaffardev.MicroLMS.model.AssignmentSubmission;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AssignmentInCourseResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private Integer maxMarks;
    private Integer aquiredMarks;
    private List<String> materials;
    private Long courseId;
    private List<Long> submissions;
    private boolean isSubmittedByStudent;
    private LocalDateTime submissionDate;
}