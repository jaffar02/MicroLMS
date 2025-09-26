package com.jaffardev.MicroLMS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AssignmentSubmissionResponse {
    private Long submissionId;
    private Long assignmentId;
    private String studentEmail;
    private LocalDateTime submittedAt;
    private List<String> files;
    private Integer acquiredMarks; // null until graded
}