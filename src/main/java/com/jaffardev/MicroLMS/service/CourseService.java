package com.jaffardev.MicroLMS.service;

import com.jaffardev.MicroLMS.dto.CreateCourseRequest;
import com.jaffardev.MicroLMS.dto.CreateCourseResponse;
import com.jaffardev.MicroLMS.dto.ListCoursesResponse;
import com.jaffardev.MicroLMS.model.Course;
import com.jaffardev.MicroLMS.model.User;
import com.jaffardev.MicroLMS.repository.CourseRepository;
import com.jaffardev.MicroLMS.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
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
            courses = courseRepository.findByTeacherId(user.getId());
        } else {
            courses = courseRepository.findByStudentsContaining(user);
        }

        // Map Course entities to CourseResponse DTOs
        return courses.stream()
                .map(course -> {
                    ListCoursesResponse dto = new ListCoursesResponse();
                    dto.setId(course.getId());
                    dto.setTitle(course.getTitle());
                    dto.setDescription(course.getDescription());

                    if (isTeacher) {
                        // For teacher: no teacherName, but include enrolled students list (just emails or names)
                        List<String> studentEmails = course.getStudents().stream()
                                .map(User::getEmail)  // or getFullName(), your choice
                                .collect(Collectors.toList());
                        dto.setEnrolledStudents(studentEmails);
                        dto.setInviteCode(course.getInviteCode());
                    } else {
                        // For student: include teacherName, no enrolled students list
                        dto.setTeacherName(course.getTeacher().getFullName());
                    }

                    return dto;
                })
                .collect(Collectors.toList());
    }

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

        courseRepository.delete(course);
    }


    private String generateUniqueInviteCode() {
        String code;
        do {
            code = generateInviteCode();  // generates a new code each time
        } while (courseRepository.existsByInviteCode(code));
        return code;
    }
}