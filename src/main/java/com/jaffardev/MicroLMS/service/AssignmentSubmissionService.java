package com.jaffardev.MicroLMS.service;

import com.jaffardev.MicroLMS.dto.GradeSubmissionRequest;
import com.jaffardev.MicroLMS.dto.AssignmentSubmissionResponse;
import com.jaffardev.MicroLMS.model.Assignment;
import com.jaffardev.MicroLMS.model.AssignmentSubmission;
import com.jaffardev.MicroLMS.model.Course;
import com.jaffardev.MicroLMS.model.User;
import com.jaffardev.MicroLMS.repository.AssignmentRepository;
import com.jaffardev.MicroLMS.repository.AssignmentSubmissionRepository;
import com.jaffardev.MicroLMS.repository.CourseRepository;
import com.jaffardev.MicroLMS.repository.UserRepository;
import com.jaffardev.MicroLMS.utils.CommonUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class AssignmentSubmissionService {
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final CourseRepository courseRepository;
    private final AssignmentSubmissionRepository submissionRepository;

    public AssignmentSubmissionResponse submitAssignment(Long assignmentId, String studentEmail,
                                                         MultipartFile[] files) throws IOException {
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

        boolean alreadySubmitted = submissionRepository.existsByAssignmentIdAndStudentId(assignmentId, student.getId());
        if (alreadySubmitted) {
            throw new RuntimeException("You have already submitted this assignment. Unsubmit first to resubmit.");
        }

        boolean enrolled = assignment.getCourse().getStudents().contains(student);

        if (!enrolled) {
            throw new RuntimeException("You are not enrolled in this course.");
        }

        Path uploadDir = Paths.get("uploads",
                String.valueOf(assignment.getCourse().getId()),
                "assignments",
                String.valueOf(assignmentId),
                student.getId().toString());

        Files.createDirectories(uploadDir);

        List<String> filePaths = new ArrayList<>();
        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                if (!CommonUtils.isValidFile(file)) {
                    throw new RuntimeException("Invalid file type: " + file.getOriginalFilename());
                }

                String safeName = UUID.randomUUID() + "-" +
                        StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));

                Path destination = uploadDir.resolve(safeName);
                Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

                filePaths.add("/uploads/" + assignment.getCourse().getId()
                        + "/assignments/" + assignmentId
                        + "/" + student.getId()
                        + "/" + safeName);
            }
        }

        AssignmentSubmission submission = new AssignmentSubmission();
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setFilePaths(filePaths);

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

    public void unsubmit(Long assignmentId, String studentEmail) {
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

        // Remove submission
        submissionRepository.delete(submission);
    }
}
