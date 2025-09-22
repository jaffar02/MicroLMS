package com.jaffardev.MicroLMS.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.jaffardev.MicroLMS.model.User;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Data
@Setter
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ListCoursesResponse {
    private Long id;
    private String title;
    private String description;
    private String inviteCode;
    private String teacherName;  // or teacher email, etc.
    private List<String> enrolledStudents;
}
