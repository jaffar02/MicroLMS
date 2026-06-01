package com.jaffardev.MicroLMS.dto;

import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class AssignmentSubmissionResponse extends AssignmentUnSubmitResponse {
//    private Long submissionId;
//    private Long assignmentId;
//    private String studentEmail;
    private LocalDateTime submittedAt;
//    private List<String> files;
    private Integer acquiredMarks; // null until graded

    public AssignmentSubmissionResponse(Long submissionId, Long assignmentId, String studentEmail,
                                        LocalDateTime submittedAt, List<String> files, Integer acquiredMarks) {
        super(submissionId, assignmentId, studentEmail, files); // Sets fields in parent class
        this.submittedAt = submittedAt;
        this.acquiredMarks = acquiredMarks;
    }
}