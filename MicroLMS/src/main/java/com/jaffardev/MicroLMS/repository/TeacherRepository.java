package com.jaffardev.MicroLMS.repository;

import com.jaffardev.MicroLMS.model.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    List<Teacher> findByTitle(String title);
}
