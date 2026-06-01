package com.jaffardev.MicroLMS.repository;

import com.jaffardev.MicroLMS.model.Course;
import com.jaffardev.MicroLMS.model.Role;
import com.jaffardev.MicroLMS.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("SELECT DISTINCT c FROM Course c " +
            "LEFT JOIN FETCH c.assignments a " +
            "LEFT JOIN FETCH a.submissions " +
            "WHERE c.teacher.id = :teacherId")
    List<Course> findByTeacherIdOptimized(@Param("teacherId") Long teacherId);

    @Query("SELECT DISTINCT c FROM Course c " +
            "LEFT JOIN FETCH c.assignments a " +
            "LEFT JOIN FETCH a.submissions " +
            "WHERE :student MEMBER OF c.students")
    List<Course> findByStudentsContainingOptimized(@Param("student") User student);
}
