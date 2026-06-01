package com.jaffardev.MicroLMS.service;

import com.jaffardev.MicroLMS.dto.AssignmentUnSubmitResponse;
import com.jaffardev.MicroLMS.dto.GradeSubmissionRequest;
import com.jaffardev.MicroLMS.dto.AssignmentSubmissionResponse;
import com.jaffardev.MicroLMS.model.*;
import com.jaffardev.MicroLMS.repository.AssignmentRepository;
import com.jaffardev.MicroLMS.repository.AssignmentSubmissionRepository;
import com.jaffardev.MicroLMS.repository.CourseRepository;
import com.jaffardev.MicroLMS.repository.UserRepository;
import com.jaffardev.MicroLMS.utils.CommonUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;


@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentSubmissionService {
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final CourseRepository courseRepository;
    private final AssignmentSubmissionRepository submissionRepository;

    public AssignmentSubmissionResponse submitAssignment(Long assignmentId, String studentEmail,
                                                         MultipartFile[] files,
                                                         List<String> retainedFiles) throws IOException {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getRoles().stream().noneMatch(role -> role.getName().equals("STUDENT"))) {
            throw new RuntimeException("Only students can submit.");
        }

        if (assignment.getDueDate() != null && LocalDateTime.now().isAfter(assignment.getDueDate())) {
            throw new RuntimeException("Cannot submit after due date");
        }

        boolean enrolled = assignment.getCourse().getStudents().contains(student);
        if (!enrolled) {
            throw new RuntimeException("You are not enrolled in this course.");
        }

        Optional<AssignmentSubmission> existingSubmissionOpt = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, student.getId());
        if (existingSubmissionOpt.isPresent()) {
            AssignmentSubmission existing = existingSubmissionOpt.get();
            // If they already turned it in and haven't clicked unsubmit, block them
            if (existing.getStatus() == SubmissionStatus.SUBMITTED) {
                throw new RuntimeException("You have already submitted this assignment. Unsubmit first to resubmit.");
            }
        }

        Path uploadDir = Paths.get("uploads",
                String.valueOf(assignment.getCourse().getId()),
                "assignments",
                String.valueOf(assignmentId),
                student.getId().toString());
        Files.createDirectories(uploadDir);

        List<String> combinedFilePaths = new ArrayList<>();
        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                if (!CommonUtils.isValidFile(file)) {
                    throw new RuntimeException("Invalid file type: " + file.getOriginalFilename());
                }

                String safeName = UUID.randomUUID() + "-" +
                        StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

                Path destination = uploadDir.resolve(safeName);
                Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

                combinedFilePaths.add("/uploads/" + assignment.getCourse().getId()
                        + "/assignments/" + assignmentId
                        + "/" + student.getId()
                        + "/" + safeName);
            }
        }

        AssignmentSubmission submission;
        if (existingSubmissionOpt.isPresent()) {
            // We are updating the current DRAFT row
            submission = existingSubmissionOpt.get();

            List<String> incomingRetained = (retainedFiles != null) ? retainedFiles : new ArrayList<>();

            // STORAGE CLEANUP: Delete previous files from disk right before substituting new ones
            if (submission.getFilePaths() != null) {
                for (String oldPath : submission.getFilePaths()) {
                    if (!incomingRetained.contains(oldPath)) {
                        // This means the student clicked the 'X' button for this file!
                        try {
                            Path oldSystemPath = Paths.get(oldPath.substring(1));
                            Files.deleteIfExists(oldSystemPath);
                            log.info("Deleted removed draft file from disk: " + oldPath);
                        } catch (Exception e) {
                            log.error("Failed to clean up dropped draft file from disk: " + oldPath, e);
                        }
                    } else {
                        // Student kept it, carry it forward into the submission
                        combinedFilePaths.add(oldPath);
                    }
                }
            }
            submission.setFilePaths(combinedFilePaths);
            submission.setSubmittedAt(LocalDateTime.now());
            submission.setStatus(SubmissionStatus.SUBMITTED); // Re-lock it
        } else {
            // Clean create: First time submission
            submission = new AssignmentSubmission();
            submission.setAssignment(assignment);
            submission.setStudent(student);
            submission.setSubmittedAt(LocalDateTime.now());
            submission.setFilePaths(combinedFilePaths);
            submission.setStatus(SubmissionStatus.SUBMITTED);
        }

        submissionRepository.save(submission);

        return new AssignmentSubmissionResponse(
                submission.getId(),
                assignmentId,
                studentEmail,
                submission.getSubmittedAt(),
                submission.getFilePaths(),
                null
        );
    }

    public AssignmentSubmissionResponse gradeSubmission(GradeSubmissionRequest gradeSubmissionRequest, String email) {
        AssignmentSubmission submission = submissionRepository.findById(gradeSubmissionRequest.getSubmissionId())
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        if (submission.getAcquiredMarks() != null) {
            throw new RuntimeException("Submission already graded.");
        }

        if (gradeSubmissionRequest.getMarks() > submission.getAssignment().getMaxMarks()) {
            throw new RuntimeException("Given marks exceeds max marks.");
        }

        User teacher = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        Assignment assignment = submission.getAssignment();
        Course course = assignment.getCourse();
        if (!course.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You are not authorized to grade submissions for this course.");
        }
        // ✅ Check if this submission belongs to the provided course
        if (!course.getId().equals(gradeSubmissionRequest.getCourseId())) {
            throw new RuntimeException("Submission does not belong to the specified course.");
        }

        submission.setAcquiredMarks(gradeSubmissionRequest.getMarks());
        submission = submissionRepository.save(submission);

        String assignmentTitle = assignment.getCourse().getTitle();
        emailService.sendSimpleEmailAsync(
                submission.getStudent().getEmail(),
                "Assignment Graded: " + submission.getAssignment().getTitle(),
                "Your assignment \"" + submission.getAssignment().getTitle() + "\" in course \"" + assignmentTitle +
                        "\" has been graded.\n" +
                        "You scored: " + gradeSubmissionRequest.getMarks() + " out of " + submission.getAssignment().getMaxMarks() + "."
        );

        return new AssignmentSubmissionResponse(
                submission.getId(),
                submission.getStudent().getId(),
                submission.getStudent().getEmail(),
                submission.getSubmittedAt(),
                submission.getFilePaths(),
                submission.getAcquiredMarks()
        );
    }


    public AssignmentSubmissionResponse updateGradeSubmission(Long submissionId, Integer newMarks) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        Assignment assignment = submission.getAssignment();
        if (!assignmentRepository.existsById(assignment.getId())) {
            throw new RuntimeException("Assignment not exist.");
        }

        if (newMarks > assignment.getMaxMarks()) {
            throw new RuntimeException("Given marks exceeds max marks.");
        }

        submission.setAcquiredMarks(newMarks);
        submission = submissionRepository.save(submission);

        // Send email notification asynchronously
        User student = submission.getStudent();
        String courseTitle = assignment.getCourse().getTitle();
        String assignmentTitle = assignment.getTitle();
        Integer maxMarks = assignment.getMaxMarks();

        emailService.sendSimpleEmailAsync(
                student.getEmail(),
                "Updated Grade for Assignment: " + assignmentTitle,
                "Your grade for assignment \"" + assignmentTitle + "\" in course \"" + courseTitle +
                        "\" has been updated.\n" +
                        "New score: " + newMarks + " out of " + maxMarks + "."
        );

        return new AssignmentSubmissionResponse(
                submission.getId(),
                assignment.getId(),
                student.getEmail(),
                submission.getSubmittedAt(),
                submission.getFilePaths(),
                submission.getAcquiredMarks()
        );
    }

    public List<AssignmentSubmissionResponse> getSubmissionsForAssignment(Long assignmentId
            , String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        if (teacher.getRoles().stream().noneMatch(role -> role.getName().equals("TEACHER"))) {
            throw new RuntimeException("Only teachers can update courses");
        }
        return submissionRepository.findByAssignmentId(assignmentId)
                .stream()
                .map(s -> new AssignmentSubmissionResponse(
                        s.getId(),
                        s.getStudent().getId(),
                        s.getStudent().getEmail(),
                        s.getSubmittedAt(),
                        s.getFilePaths(),
                        s.getAcquiredMarks()
                )).toList();
    }

    public AssignmentSubmission getSubmissionDetails(Long assignmentId, String studentEmail) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return submissionRepository.findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElse(null);
    }

    @Transactional()
    public AssignmentUnSubmitResponse unsubmit(Long assignmentId, String studentEmail) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        AssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElseThrow(() -> new RuntimeException("No submission found"));

        // Check due date
        if (assignment.getDueDate() != null && LocalDateTime.now().isAfter(assignment.getDueDate())) {
            throw new RuntimeException("Cannot unsubmit after due date");
        }

        // Check grading
        if (submission.getAcquiredMarks() != null) {
            throw new RuntimeException("Cannot unsubmit after grading");
        }

        try {
            submission.setStatus(SubmissionStatus.DRAFT);
            submissionRepository.save(submission);
        } catch (Exception e) {
            log.error(e.getMessage());
            throw new RuntimeException("An error occurred updating submission to draft status.");
        }

        return AssignmentUnSubmitResponse.builder()
                .submissionId(submission.getId())
                .studentEmail(submission.getStudent().getEmail())
                .assignmentId(submission.getAssignment().getId())
                .files(new ArrayList<>(submission.getFilePaths()))
                .build();
    }
}
