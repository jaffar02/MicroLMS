package com.jaffardev.MicroLMS.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GradeSubmissionRequest {
    @NotNull(message = "course id cannot be null.")
    private Long courseId;
    @NotNull(message = "submission id cannot be null.")
    private Long submissionId;
    @NotNull(message = "marks cannot be null.")
    Integer marks;
}
