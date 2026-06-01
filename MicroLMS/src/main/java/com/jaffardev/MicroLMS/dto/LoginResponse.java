package com.jaffardev.MicroLMS.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    public String token;
    public String email;
    public String fullName;
    public List<String> roles;
    public String title;
    public String department;
}
