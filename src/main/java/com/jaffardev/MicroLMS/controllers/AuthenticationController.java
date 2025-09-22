package com.jaffardev.MicroLMS.controllers;

import com.jaffardev.MicroLMS.config.JwtConfig;
import com.jaffardev.MicroLMS.dto.JwtResponse;
import com.jaffardev.MicroLMS.dto.LoginUserRequest;
import com.jaffardev.MicroLMS.dto.RegisterUserRequest;
import com.jaffardev.MicroLMS.model.Role;
import com.jaffardev.MicroLMS.model.User;
import com.jaffardev.MicroLMS.security.JwtFilter;
import com.jaffardev.MicroLMS.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final JwtConfig jwtConfig;

    @PostMapping("/register")
    public ResponseEntity<JwtResponse> registerUser(@Valid @RequestBody RegisterUserRequest userRequest) {
        User isReg = authenticationService.registerUser(userRequest);
        String msg = (isReg != null ? "Registration Success" : "Registration Failed");
        List<String> roles = userRequest.getRoles()
                .stream()
                .map(Role::getName)
                .toList();
        String token = jwtConfig.generateToken(userRequest.getEmail(), roles);
        return ResponseEntity.ok(JwtResponse.builder().token(token).build());
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginUserRequest userRequest) {
        try {
            User user = authenticationService.loginUser(userRequest);
            if (user != null) {
                // Extract roles as List<String>
                List<String> roles = user.getRoles()
                        .stream()
                        .map(Role::getName) // If name is a String, otherwise role.getName().name() for enum
                        .toList();

                // Generate JWT token
                String token = jwtConfig.generateToken(user.getEmail(), roles);

                // Return token and basic info
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("email", user.getEmail());
                response.put("fullName", user.getFullName());
                response.put("roles", roles);

                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid credentials");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login failed: " + e.getMessage());
        }
    }

}
