package com.jaffardev.MicroLMS.repository;

import com.jaffardev.MicroLMS.model.Assignment;
import lombok.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByCourseId(Long courseId);

    boolean existsById(@NonNull Long courseId);
}
