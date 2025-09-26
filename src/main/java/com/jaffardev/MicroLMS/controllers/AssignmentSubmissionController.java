package com.jaffardev.MicroLMS.controllers;

import com.jaffardev.MicroLMS.dto.GradeSubmissionRequest;
import com.jaffardev.MicroLMS.dto.AssignmentSubmissionResponse;
import com.jaffardev.MicroLMS.service.AssignmentSubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class AssignmentSubmissionController {
    private final AssignmentSubmissionService submissionService;

    // STUDENT submits assignment
    @PostMapping("/{assignmentId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitAssignment(
            @PathVariable Long assignmentId,
            @RequestPart(value = "files", required = false) MultipartFile[] files,
            Authentication authentication) throws IOException {

        try {
            String studentEmail = authentication.getName();

            AssignmentSubmissionResponse response = submissionService.submitAssignment(
                    assignmentId,
                    studentEmail,
                    files
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    // TEACHER grades submission
    @PutMapping("/grade")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> gradeSubmission(@Valid
            @RequestBody GradeSubmissionRequest gradeSubmissionRequest, Authentication authentication) {
        try {
            String teacherEmail = authentication.getName();
            AssignmentSubmissionResponse response = submissionService.gradeSubmission(gradeSubmissionRequest, teacherEmail);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // TEACHER or STUDENT view submissions
    @GetMapping("/assignment/{assignmentId}")
    @PreAuthorize("hasAnyRole('TEACHER')")
    public ResponseEntity<?> getSubmissions(@PathVariable Long assignmentId, Authentication authentication) {
        try {
            String teacherEmail = authentication.getName();
            return ResponseEntity.ok(submissionService.getSubmissionsForAssignment(assignmentId, teacherEmail));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{assignmentId}/unsubmit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> unsubmit(
            @PathVariable Long assignmentId,
            Authentication authentication) {
        try {
            String studentEmail = authentication.getName();
            submissionService.unsubmit(assignmentId, studentEmail);
            return ResponseEntity.ok(Map.of("message", "Submission withdrawn successfully"));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/grade/{submissionId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> updateGrade(
            @PathVariable Long submissionId,
            @RequestParam Integer marks) {
        try {
            AssignmentSubmissionResponse response = submissionService.updateGradeSubmission(submissionId, marks);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}