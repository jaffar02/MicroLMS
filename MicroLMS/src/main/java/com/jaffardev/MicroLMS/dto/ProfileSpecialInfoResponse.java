package com.jaffardev.MicroLMS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfileSpecialInfoResponse {
    int totalCourses;
    int totalStudents;
    int totalAssignments;
}
