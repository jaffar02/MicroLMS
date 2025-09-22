package com.jaffardev.MicroLMS.controllers;

import com.jaffardev.MicroLMS.config.JwtConfig;
import com.jaffardev.MicroLMS.dto.CreateCourseRequest;
import com.jaffardev.MicroLMS.dto.JwtResponse;
import com.jaffardev.MicroLMS.dto.LoginUserRequest;
import com.jaffardev.MicroLMS.dto.RegisterUserRequest;
import com.jaffardev.MicroLMS.model.Course;
import com.jaffardev.MicroLMS.model.Role;
import com.jaffardev.MicroLMS.model.User;
import com.jaffardev.MicroLMS.repository.CourseRepository;
import com.jaffardev.MicroLMS.repository.UserRepository;
import com.jaffardev.MicroLMS.security.JwtFilter;
import com.jaffardev.MicroLMS.service.AuthenticationService;
import com.jaffardev.MicroLMS.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final UserRepository userRepository;
    private final JwtConfig jwtConfig;

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@Valid @RequestBody RegisterUserRequest userRequest) {
        User isReg = authenticationService.registerUser(userRequest);
        String msg = (isReg != null ? "Registration successful. Please verify your email before logging in." : "Registration Failed");
        return ResponseEntity.ok(msg);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginUserRequest userRequest) {
        try {
            User user = authenticationService.loginUser(userRequest);
            if (user != null) {
                if (!user.isEnabled()) {  // or user.isVerified() or your field
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Account not verified. Please verify your email.");
                }

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

    @GetMapping("/verify")
    public String verifyUser(@RequestParam("code") String code) {
        User user = userRepository.findByVerificationCode(code);
        if (user == null) {
            return "Verification failed: invalid code";
        }

        user.setEnabled(true);
        user.setVerificationCode(null); // clear the code
        userRepository.save(user);

        return "Verification successful! You can now login.";
    }
}
