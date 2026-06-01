package com.jaffardev.MicroLMS.service;

import com.jaffardev.MicroLMS.dto.*;
import com.jaffardev.MicroLMS.model.Assignment;
import com.jaffardev.MicroLMS.model.AssignmentSubmission;
import com.jaffardev.MicroLMS.model.Course;
import com.jaffardev.MicroLMS.model.User;
import com.jaffardev.MicroLMS.repository.CourseRepository;
import com.jaffardev.MicroLMS.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.jaffardev.MicroLMS.utils.CommonUtils.generateInviteCode;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public CreateCourseResponse createCourse(CreateCourseRequest request, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        if (teacher.getRoles().stream().noneMatch(role -> role.getName().equals("TEACHER"))) {
            throw new RuntimeException("Only teachers can create courses");
        }
        Course course = new Course();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setTeacher(teacher);
        course.setInviteCode(generateUniqueInviteCode());

        Course savedCourse = courseRepository.save(course);
        return mapToCourseResponse(savedCourse);
    }

    public CreateCourseResponse updateCourse(UpdateCourseRequest request, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        if (teacher.getRoles().stream().noneMatch(role -> role.getName().equals("TEACHER"))) {
            throw new RuntimeException("Only teachers can update courses");
        }

        Optional<Course> existingCourse = courseRepository.findById(request.getId());
        if (existingCourse.isEmpty()) {
            throw new RuntimeException("Course does not exist.");
        }

        Course course = existingCourse.get();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());

        Course savedCourse = courseRepository.save(course);
        return mapToCourseResponse(savedCourse);
    }

    public ProfileSpecialInfoResponse getProfileSpecialInfo(String email) {
        User teacher = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        if (teacher.getRoles().stream().noneMatch(role -> role.getName().equals("TEACHER"))) {
            throw new RuntimeException("Not authorized.");
        }

        List<ListCoursesResponse> courses =  getCoursesByUserEmail(email);
        int totalCourses = courses.size();
        int totalStudents = courses.stream()
                .mapToInt(listCoursesResponse -> listCoursesResponse.getEnrolledStudents().size())
                .sum();
        int totalAssignments = courses.stream()
                .mapToInt(listCoursesResponse -> listCoursesResponse.getAssignments().size())
                .sum();
        return ProfileSpecialInfoResponse.builder()
                .totalCourses(totalCourses)
                .totalStudents(totalStudents)
                .totalAssignments(totalAssignments)
                .build();
    }

    private CreateCourseResponse mapToCourseResponse(Course course) {
        CreateCourseResponse response = new CreateCourseResponse();
        response.setId(course.getId());
        response.setTitle(course.getTitle());
        response.setDescription(course.getDescription());
        response.setInviteCode(course.getInviteCode());
        return response;
    }

    public void enrollStudentToCourse(String email, String inviteCode) {
        Course course = courseRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid invite code"));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user has role "STUDENT"
        boolean isStudent = user.getRoles().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase("STUDENT"));

        if (!isStudent) {
            throw new RuntimeException("User is not a student");
        }

        if (course.getStudents().contains(user)) {
            throw new RuntimeException("User already enrolled in the course");
        }

        course.getStudents().add(user);
        courseRepository.save(course);
    }


    public void unenrollStudentFromCourse(Long courseId, String teacherEmail, String studentEmail) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (!course.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You are not authorized to unenroll students from this course");
        }

        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        boolean isStudent = student.getRoles().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase("STUDENT"));

        if (!isStudent) {
            throw new RuntimeException("The user is not a student");
        }

        if (!course.getStudents().contains(student)) {
            throw new RuntimeException("Student is not enrolled in this course");
        }

        course.getStudents().remove(student);
        courseRepository.save(course);
    }

    public List<ListCoursesResponse> getCoursesByUserEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isTeacher = user.getRoles().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase("TEACHER"));

        List<Course> courses;
        if (isTeacher) {
            // This now fetches course + assignments + submissions in 1 query
            courses = courseRepository.findByTeacherIdOptimized(user.getId());
        } else {
            // This also fetches course + assignments + submissions in 1 query
            courses = courseRepository.findByStudentsContainingOptimized(user);
        }

        // Map Course entities to CourseResponse DTOs
        // Map Course entities to CourseResponse DTOs
        return courses.stream()
                .map(course -> {
                    ListCoursesResponse dto = new ListCoursesResponse();
                    dto.setId(course.getId());
                    dto.setTitle(course.getTitle());
                    dto.setDescription(course.getDescription());
                    dto.setTeacherName(course.getTeacher().getFullName());

                    if (isTeacher) {
                        dto.setInviteCode(course.getInviteCode());
                        dto.setEnrolledStudents(course.getStudents().stream()
                                .map(s -> Map.of("name", s.getFullName(), "email", s.getEmail()))
                                .collect(Collectors.toList()));
                    }

                    // Consolidated Assignment Mapping
                    dto.setAssignments(course.getAssignments().stream()
                            .map(assignment -> {
                                // For teachers, this defaults to false (which is fine)
                                // For students, it checks the actual submission status
                                AssignmentSubmission studentSubmission = assignment.getSubmissions().stream()
                                        .filter(s -> s.getStudent().getEmail().equals(email))
                                        .findFirst()
                                        .orElse(null);

                                boolean submitted = studentSubmission != null;
                                boolean graded = submitted && studentSubmission.getAcquiredMarks() != null;

                                return AssignmentInCourseResponse.builder()
                                        .id(assignment.getId())
                                        .title(assignment.getTitle())
                                        .description(assignment.getDescription())
                                        .dueDate(assignment.getDueDate())
                                        .maxMarks(assignment.getMaxMarks())
                                        .isSubmittedByStudent(submitted)
                                        .submissionDate(submitted ? studentSubmission.getSubmittedAt() : null)
                                        .submissions(assignment.getSubmissions().stream()
                                                .map(AssignmentSubmission::getId)
                                                .collect(Collectors.toList()))
                                        .aquiredMarks(graded ? studentSubmission.getAcquiredMarks() : null)
                                        .build();
                            })
                            .collect(Collectors.toList()));

                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteCourse(Long courseId, String teacherEmail) {
        User teacher = userRepository.findByEmail(teacherEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is a teacher
        boolean isTeacher = teacher.getRoles().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase("TEACHER"));

        if (!isTeacher) {
            throw new RuntimeException("Only teachers can delete courses");
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Only the teacher who owns the course can delete it
        if (!course.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You are not authorized to delete this course");
        }

        try {
            courseRepository.delete(course);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public GetCourseResponse getCourse(Long courseId, String email) throws RuntimeException {
        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Use findById instead of getReferenceById to avoid LazyInitialization issues
        // when accessing fields like teacher and assignments.
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        boolean isTeacher = u.getRoles().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase("TEACHER"));

        // --- Access Control Check (Do this BEFORE mapping data) ---
        if (isTeacher) {
            if (!course.getTeacher().getId().equals(u.getId())) {
                throw new RuntimeException("You do not have permission to view this course.");
            }
        } else {
            if (!course.getStudents().contains(u)) {
                throw new RuntimeException("You are not enrolled in this course.");
            }
        }

        GetCourseResponse res = new GetCourseResponse();
        res.setTitle(course.getTitle());
        res.setDescription(course.getDescription());

        if (isTeacher) {
            List<Map<String, String>> studentEmails = course.getStudents().stream()
                    .map(user1 -> {
                        Map<String, String> map = new HashMap<>();
                        map.put("name", user1.getFullName());
                        map.put("email", user1.getEmail());
                        return map;
                    })
                    .collect(Collectors.toList());

            res.setEnrolledStudents(studentEmails);
            res.setInviteCode(course.getInviteCode());
        } else {
            res.setTeacherName(course.getTeacher().getFullName());
        }

        // --- Optimized Assignment Mapping ---
        res.setAssignments(course.getAssignments().stream().map(assignment -> {
            // Pre-calculate status for students
            AssignmentSubmission studentSubmission = assignment.getSubmissions().stream()
                    .filter(s -> s.getStudent().getEmail().equals(email))
                    .findFirst()
                    .orElse(null);

            boolean submitted = studentSubmission != null;
            boolean graded = submitted && studentSubmission.getAcquiredMarks() != null;

            return AssignmentInCourseResponse.builder()
                    .id(assignment.getId())
                    .title(assignment.getTitle())
                    .maxMarks(assignment.getMaxMarks())
                    .description(assignment.getDescription())
                    .dueDate(assignment.getDueDate())
                    .isSubmittedByStudent(submitted) // Now the frontend knows!
                    .submissionDate(submitted ? studentSubmission.getSubmittedAt() : null)
                    .materials(assignment.getMaterials().stream().toList())
                    .submissions(assignment.getSubmissions().stream()
                            .map(AssignmentSubmission::getId)
                            .collect(Collectors.toList()))
                    .aquiredMarks(graded ? studentSubmission.getAcquiredMarks() : null)
                    .build();
        }).toList());

        return res;
    }


    private String generateUniqueInviteCode() {
        String code;
        do {
            code = generateInviteCode();  // generates a new code each time
        } while (courseRepository.existsByInviteCode(code));
        return code;
    }
}