package com.jaffardev.MicroLMS.repository;

import com.jaffardev.MicroLMS.model.Course;
import com.jaffardev.MicroLMS.model.Role;
import com.jaffardev.MicroLMS.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {
    // Get all courses created by a specific teacher
    List<Course> findByTeacher(User teacher);

    List<Course> findByTeacherId(Long teacherId);

    // Get all courses where a student is enrolled (for student dashboard)
    List<Course> findByStudentsContaining(User student);

    Optional<Course> findByInviteCode(String inviteCode);

    boolean existsByInviteCode(String inviteCode);

}
