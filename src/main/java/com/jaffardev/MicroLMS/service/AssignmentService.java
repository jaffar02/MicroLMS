package com.jaffardev.MicroLMS.service;

import com.jaffardev.MicroLMS.dto.CreateAssignmentRequest;
import com.jaffardev.MicroLMS.dto.CreateAssignmentResponse;
import com.jaffardev.MicroLMS.dto.UpdateAssignmentRequest;
import com.jaffardev.MicroLMS.model.Assignment;
import com.jaffardev.MicroLMS.model.AssignmentSubmission;
import com.jaffardev.MicroLMS.model.Course;
import com.jaffardev.MicroLMS.model.User;
import com.jaffardev.MicroLMS.repository.AssignmentRepository;
import com.jaffardev.MicroLMS.repository.CourseRepository;
import com.jaffardev.MicroLMS.repository.UserRepository;
import jakarta.transaction.Transactional;
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
import java.util.*;

import static com.jaffardev.MicroLMS.utils.CommonUtils.isValidFile;

@Service
@RequiredArgsConstructor
@Transactional
public class AssignmentService {
    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public CreateAssignmentResponse createAssignment(CreateAssignmentRequest request, String teacherEmail) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Ensure teacher owns the course
        if (!course.getTeacher().getEmail().equals(teacherEmail)) {
            throw new RuntimeException("You are not the teacher of this course");
        }

        Assignment assignment = new Assignment();
        assignment.setDescription(request.getDescription());
        assignment.setTitle(request.getTitle());
        assignment.setMaxMarks(request.getMaxMarks());
        assignment.setCourse(course);
        if (request.getDueDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Due date cannot be in the past");
        }
        assignment.setDueDate(request.getDueDate());

        if (request.getMaterials() != null) {
            assignment.setMaterials(new HashSet<>(request.getMaterials()));
        }

        Assignment saved = assignmentRepository.save(assignment);

        // Notify all students
        course.getStudents().forEach(student -> {
            emailService.sendSimpleEmailAsync(
                    student.getEmail(),
                    "New Assignment in " + course.getTitle(),
                    "A new assignment has been posted: " + request.getDescription()
            );
        });

        return new CreateAssignmentResponse(
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getMaxMarks(),
                new ArrayList<>(saved.getMaterials()),
                course.getId(),
                assignment.getDueDate()
        );
    }

    public CreateAssignmentResponse updateAssignment(Long id,
                                                     UpdateAssignmentRequest request,
                                                     String teacherEmail) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        // verify ownership
        if (!assignment.getCourse().getTeacher().getEmail().equals(teacherEmail)) {
            throw new RuntimeException("Not authorized to update this assignment");
        }

        // update only metadata
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDueDate(request.getDueDate());
        assignment.setMaxMarks(request.getMaxMarks());

        assignmentRepository.save(assignment);

        return new CreateAssignmentResponse(
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getMaxMarks(),
                new ArrayList<>(assignment.getMaterials()),
                assignment.getCourse().getId(),
                assignment.getDueDate()
        );
    }


    @Transactional
    public void deleteAssignment(Long id, String teacherEmail) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        // verify teacher owns the course
        if (!assignment.getCourse().getTeacher().getEmail().equals(teacherEmail)) {
            throw new RuntimeException("You are not authorized to delete this assignment");
        }

        // delete associated files if any
        if (assignment.getMaterials() != null) {
            for (String path : assignment.getMaterials()) {
                try {
                    Path filePath = Paths.get(path.replaceFirst("/", "")); // remove leading slash
                    Files.deleteIfExists(filePath);
                } catch (IOException ex) {
                    // log but don’t block deletion
                    System.err.println("Could not delete file: " + path);
                }
            }
        }

        assignmentRepository.delete(assignment);
    }

    public List<CreateAssignmentResponse> getAssignmentsByCourse(Long courseId, String email) {
        Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isTeacher = user.getRoles().stream()
                .anyMatch(r -> r.getName().equalsIgnoreCase("TEACHER"));
        boolean isStudent = user.getRoles().stream()
                .anyMatch(r -> r.getName().equalsIgnoreCase("STUDENT"));

        if (isTeacher) {
            if (!course.getTeacher().getId().equals(user.getId())) {
                throw new RuntimeException("You are not authorized to view assignments for this course");
            }
        } else if (isStudent) {
            if (!course.getStudents().contains(user)) {
                throw new RuntimeException("You are not enrolled in this course");
            }
        } else {
            throw new RuntimeException("Invalid role");
        }

        List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);
        return assignments.stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<CreateAssignmentResponse> getSubmissionRemainAssignmentsByCourse(Long courseId, String email) {
        Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isStudent = user.getRoles().stream()
                .anyMatch(r -> r.getName().equalsIgnoreCase("STUDENT"));

        if (isStudent) {
            if (!course.getStudents().contains(user)) {
                throw new RuntimeException("You are not enrolled in this course");
            }
        } else {
            throw new RuntimeException("Invalid role");
        }

        List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);

        List<Assignment> submissionRemainAssignments = assignments.stream()
                .filter(assignment -> assignment.getSubmissions().stream()
                        .noneMatch(submission -> submission.getStudent().getEmail().equals(email)))
                .toList();

        return submissionRemainAssignments.stream()
                .map(this::mapToResponse)
                .toList();
    }

    public CreateAssignmentResponse getAssignmentById(Long id, String email) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        Course course = assignment.getCourse();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isTeacher = user.getRoles().stream()
                .anyMatch(r -> r.getName().equalsIgnoreCase("TEACHER"));
        boolean isStudent = user.getRoles().stream()
                .anyMatch(r -> r.getName().equalsIgnoreCase("STUDENT"));

        if (isTeacher) {
            if (!course.getTeacher().getId().equals(user.getId())) {
                throw new RuntimeException("You are not authorized to view this assignment");
            }
        } else if (isStudent) {
            if (!course.getStudents().contains(user)) {
                throw new RuntimeException("You are not enrolled in this course");
            }
        } else {
            throw new RuntimeException("Invalid role");
        }

        return mapToResponse(assignment);
    }

    // helper to map entity → response DTO
    private CreateAssignmentResponse mapToResponse(Assignment assignment) {
        return CreateAssignmentResponse.builder()
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .dueDate(assignment.getDueDate())
                .maxMarks(assignment.getMaxMarks())
                .materials(new ArrayList<>(assignment.getMaterials()))
                .courseId(assignment.getCourse().getId())
                .build();
    }
}
