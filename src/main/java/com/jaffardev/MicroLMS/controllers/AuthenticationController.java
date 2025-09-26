package com.jaffardev.MicroLMS.controllers;

import com.jaffardev.MicroLMS.config.JwtConfig;
import com.jaffardev.MicroLMS.dto.*;
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

    //TODO Update account info.
    //TODO Update accound password.
    private final AuthenticationService authenticationService;
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
    public ResponseEntity<?> verifyUser(@RequestParam("code") String code) {
        try {
            boolean state = authenticationService.verifyUser(code);
            if (!state){
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Verification failed: invalid code");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login failed: " + e.getMessage());
        }

        return ResponseEntity.ok("Verification successful.");
    }

    @PutMapping("/update-info")
    public ResponseEntity<?> updateUserInfo(@Valid @RequestBody UpdateUserRequest updateUserRequest,
                                            Authentication authentication){
        try {
            String email = authentication.getName();
            authenticationService.updateUser(updateUserRequest, email);
            return ResponseEntity.ok("User info updated.");
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Update info failed: " + e.getMessage());
        }
    }


    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        try {
            authenticationService.initiatePasswordReset(forgotPasswordRequest.getEmail());
            return ResponseEntity.ok("Password reset link sent to your email.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping("/reset-pass")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest resetPasswordRequest) {
        boolean success = authenticationService.resetPassword(resetPasswordRequest.getCode(),
                resetPasswordRequest.getNewPassword());
        if (!success) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired reset code");
        }
        return ResponseEntity.ok("Password reset successful!");
    }
}
