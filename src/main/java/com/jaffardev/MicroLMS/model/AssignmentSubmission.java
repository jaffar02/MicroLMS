package com.jaffardev.MicroLMS.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Assignment assignment;

    @ManyToOne(optional = false)
    private User student;  // assuming you have a User entity

    private LocalDateTime submittedAt;

    @ElementCollection
    @CollectionTable(
            name = "submission_files",
            joinColumns = @JoinColumn(name = "submission_id")
    )
    @Column(name = "file_path")
    private List<String> filePaths = new ArrayList<>(); // multiple file paths stored

    private Integer acquiredMarks; // null until graded
}
