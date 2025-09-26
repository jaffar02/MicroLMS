package com.jaffardev.MicroLMS.controllers;

import com.jaffardev.MicroLMS.dto.CreateAssignmentRequest;
import com.jaffardev.MicroLMS.dto.CreateAssignmentResponse;
import com.jaffardev.MicroLMS.dto.UpdateAssignmentRequest;
import com.jaffardev.MicroLMS.model.Assignment;
import com.jaffardev.MicroLMS.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

import static com.jaffardev.MicroLMS.utils.CommonUtils.isValidFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/assignment")
public class AssignmentController {
    private final AssignmentService assignmentService;
    public static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "docx", "pptx", "png", "jpg", "jpeg");

    @PostMapping("/create")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> createAssignment(@RequestBody @Valid CreateAssignmentRequest request,
                                              Authentication authentication) {
        try {
            String teacherEmail = authentication.getName();
            CreateAssignmentResponse response = assignmentService.createAssignment(request, teacherEmail);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
        }
    }


    @PostMapping(
            value = "/create-with-files",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> createAssignmentWithFiles(
            @ModelAttribute CreateAssignmentRequest request,
            @RequestPart("files") MultipartFile[] files,
            Authentication authentication) throws IOException {

        Long courseId = request.getCourseId();
        Path uploadDir = Paths.get("uploads", String.valueOf(courseId));
        Files.createDirectories(uploadDir); // ensure folder exists

        List<String> filePaths = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!isValidFile(file)) {
                return ResponseEntity.badRequest().body("Invalid file type: " + file.getOriginalFilename());
            }
            String safeName = UUID.randomUUID() + "-" +
                    StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

            Path destination = uploadDir.resolve(safeName);

            // Save file
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            // Store relative path (not absolute for security)
            filePaths.add("/uploads/" + courseId + "/" + safeName);
        }
        request.setMaterials(filePaths);

        String teacherEmail = authentication.getName();
        CreateAssignmentResponse response = assignmentService.createAssignment(request, teacherEmail);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/update")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> updateAssignment(
            @PathVariable Long id,
            @RequestBody @Valid UpdateAssignmentRequest request,
            Authentication authentication) {

        try {
            String teacherEmail = authentication.getName();
            CreateAssignmentResponse response = assignmentService.updateAssignment(id, request, teacherEmail);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> deleteAssignment(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String teacherEmail = authentication.getName();

            // service will handle validation (teacher owns assignment etc.)
            assignmentService.deleteAssignment(id, teacherEmail);

            return ResponseEntity.ok(Map.of("message", "Assignment deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    //TODO Should make separate method for getting only those assignments which are not submitted yet.
    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    public ResponseEntity<?> getAssignmentsByCourse(@PathVariable Long courseId, Authentication authentication) {
        try {
            String email = authentication.getName();
            List<CreateAssignmentResponse> assignments = assignmentService.getAssignmentsByCourse(courseId, email);
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/course/submission-remain/{courseId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getSubmissionRemainAssignmentsByCourse(@PathVariable Long courseId, Authentication authentication) {
        try {
            String email = authentication.getName();
            List<CreateAssignmentResponse> assignments = assignmentService.getSubmissionRemainAssignmentsByCourse(courseId, email);
            return ResponseEntity.ok(assignments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','STUDENT')")
    public ResponseEntity<?> getAssignmentById(@PathVariable Long id, Authentication authentication) {
        try {
            String email = authentication.getName();
            CreateAssignmentResponse assignment = assignmentService.getAssignmentById(id, email);
            return ResponseEntity.ok(assignment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}