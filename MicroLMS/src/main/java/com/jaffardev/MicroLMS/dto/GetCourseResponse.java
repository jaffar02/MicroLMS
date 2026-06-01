package com.jaffardev.MicroLMS.dto;

import com.jaffardev.MicroLMS.model.Assignment;
import com.jaffardev.MicroLMS.model.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class GetCourseResponse {
    private String title;
    private String description;
    private String inviteCode;
    private String teacherName;
    private List<Map<String, String>> enrolledStudents;
    private List<AssignmentInCourseResponse> assignments;
}
