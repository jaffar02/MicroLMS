package com.jaffardev.MicroLMS.controllers;

import com.jaffardev.MicroLMS.config.JwtConfig;
import com.jaffardev.MicroLMS.dto.*;
import com.jaffardev.MicroLMS.model.Course;
import com.jaffardev.MicroLMS.model.User;
import com.jaffardev.MicroLMS.repository.UserRepository;
import com.jaffardev.MicroLMS.service.CourseService;
import com.jaffardev.MicroLMS.utils.JwtUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/course")
public class CourseController {
    private final CourseService courseService;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    @PostMapping("/create")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> createCourse(@Valid @RequestBody CreateCourseRequest courseRequest,
                                               Authentication authentication) {
        try {
            String teacherEmail = authentication.getName();
            CreateCourseResponse course = courseService.createCourse(courseRequest, teacherEmail);
            return ResponseEntity.ok(course);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", ex.getMessage()));
        }
    }


    @GetMapping("/enroll")
    public ResponseEntity<?> enrollStudent(@RequestBody EnrollmentRequest request,
                                           @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);  // remove "Bearer "
            String email = jwtUtils.extractEmail(token);

            courseService.enrollStudentToCourse(email, request.getInviteCode());

            return ResponseEntity.ok("Enrollment successful");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/unenroll")
    public ResponseEntity<?> unenrollStudent(@RequestBody UnenrollRequest request,
                                             @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String teacherEmail = jwtUtils.extractEmail(token);

            courseService.unenrollStudentFromCourse(request.getCourseId(), teacherEmail, request.getStudentEmail());
            return ResponseEntity.ok("Student unenrolled successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/list-courses")
    public ResponseEntity<?> getMyCourses(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String email = jwtUtils.extractEmail(token);
            List<ListCoursesResponse> courses = courseService.getCoursesByUserEmail(email);
            return ResponseEntity.ok(courses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/courses/{courseId}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long courseId,
                                          @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7); // remove "Bearer "
            String email = jwtUtils.extractEmail(token);

            courseService.deleteCourse(courseId, email);
            return ResponseEntity.ok("Course deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

}
