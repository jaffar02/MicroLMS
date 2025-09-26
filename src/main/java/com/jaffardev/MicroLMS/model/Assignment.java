package com.jaffardev.MicroLMS.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "assignments")
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String description;

    private Integer maxMarks;  // e.g., 100

    private String title;

    private LocalDateTime dueDate;
    // Store uploaded files (could be URLs if you use cloud storage)
    @ElementCollection
    @CollectionTable(name = "assignment_materials", joinColumns = @JoinColumn(name = "assignment_id"))
    @Column(name = "file_path")
    private Set<String> materials = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AssignmentSubmission> submissions = new ArrayList<>();
}
