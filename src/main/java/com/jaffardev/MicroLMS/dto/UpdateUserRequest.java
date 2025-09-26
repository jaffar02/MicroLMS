package com.jaffardev.MicroLMS.dto;

import com.jaffardev.MicroLMS.model.Role;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest{
    private String password;
    private String fullName;
}
