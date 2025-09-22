package com.jaffardev.MicroLMS.dto;


import com.jaffardev.MicroLMS.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterUserRequest {
    private String email;
    private String password;
    private String fullName;
    private Set<Role> roles;
}
