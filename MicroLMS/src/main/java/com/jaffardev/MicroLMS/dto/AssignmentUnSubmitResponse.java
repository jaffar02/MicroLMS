package com.jaffardev.MicroLMS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class AssignmentUnSubmitResponse {
    private Long submissionId;
    private Long assignmentId;
    private String studentEmail;
    private List<String> files;
}
