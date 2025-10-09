package com.jaffardev.MicroLMS.service;

import com.jaffardev.MicroLMS.dto.LoginUserRequest;
import com.jaffardev.MicroLMS.dto.RegisterUserRequest;
import com.jaffardev.MicroLMS.dto.UpdateUserRequest;
import com.jaffardev.MicroLMS.model.Role;
import com.jaffardev.MicroLMS.model.User;
import com.jaffardev.MicroLMS.repository.RoleRepository;
import com.jaffardev.MicroLMS.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public User registerUser(RegisterUserRequest userRequest) {
        if (userRepository.existsByEmail(userRequest.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user = new User();
        user.setEmail(userRequest.getEmail());
        user.setFullName(userRequest.getFullName());
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        Set<Role> roles = new HashSet<>();
        for (Role roleFromRequest : userRequest.getRoles()) {
            Role role = roleRepository.findByName(roleFromRequest.getName())
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleFromRequest.getName()));
            if (role.getName().equals("ADMIN"))
                throw new RuntimeException("Invalid role!");
            roles.add(role);
        }
        user.setRoles(roles);
        user.setEnabled(false);  // not verified yet
        user.setVerificationCode(UUID.randomUUID().toString());
        emailService.sendVerificationEmail(user);

        return userRepository.save(user);
    }

    @Transactional(noRollbackFor = RuntimeException.class)
    public User loginUser(LoginUserRequest userRequest) {
        User user = userRepository.findByEmail(userRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isEnabled()) {  // or user.isVerified() or your field
            user.setVerificationCode(UUID.randomUUID().toString());
            try {
                userRepository.saveAndFlush(user);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
            emailService.sendVerificationEmail(user);
            throw new RuntimeException("Account not verified. Please verify your email.");
        }

        if(passwordEncoder.matches(userRequest.getPassword(), user.getPassword())) {
            return user;
        }
        return null;
    }

    public boolean verifyUser(String code){
        User user = userRepository.findByVerificationCode(code);
        if (user == null) {
            return false;
        }
        user.setEnabled(true);
        user.setVerificationCode(null); // clear the code
        userRepository.save(user);
        return true;
    }


    public void initiatePasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setResetCode(UUID.randomUUID().toString());
        user.setResetCodeExpiry(LocalDateTime.now().plusMinutes(30)); // 30 min
        userRepository.save(user);
        emailService.sendPasswordResetEmail(user);
    }


    public boolean validateResetCode(String code) {
        User user = userRepository.findByResetCode(code);
        return user != null && !user.getResetCodeExpiry().isBefore(LocalDateTime.now());
    }

    public boolean resetPassword(String code, String newPassword) {
        User user = userRepository.findByResetCode(code);
        if (user == null || user.getResetCodeExpiry().isBefore(LocalDateTime.now())) {
            return false;
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetCode(null);
        user.setResetCodeExpiry(null);
        userRepository.save(user);
        return true;
    }

    public void updateUser(UpdateUserRequest updateUserRequest, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updateUserRequest.getFullName() != null && updateUserRequest.getPassword() != null){
            throw new RuntimeException("All fields are empty.");
        } else if (updateUserRequest.getFullName() != null) {
            user.setFullName(updateUserRequest.getFullName());
        } else if (updateUserRequest.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(updateUserRequest.getPassword()));
        }

        userRepository.save(user);
    }

    public void deleteUser(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }

    public void deleteUser(String email, String adminMail) {

        User admin = userRepository.findByEmail(adminMail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Specified user not found"));

        if (admin.getRoles().stream().noneMatch(role -> role.getName().equals("ADMIN"))) {
            throw new RuntimeException("Only admin account has rights to delete account!");
        }

        userRepository.delete(user);
    }
}
