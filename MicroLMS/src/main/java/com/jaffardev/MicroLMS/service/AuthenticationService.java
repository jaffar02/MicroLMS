package com.jaffardev.MicroLMS.service;

import com.jaffardev.MicroLMS.dto.LoginUserRequest;
import com.jaffardev.MicroLMS.dto.RegisterUserRequest;
import com.jaffardev.MicroLMS.dto.UpdateUserRequest;
import com.jaffardev.MicroLMS.model.Role;
import com.jaffardev.MicroLMS.model.Teacher;
import com.jaffardev.MicroLMS.model.User;
import com.jaffardev.MicroLMS.repository.RoleRepository;
import com.jaffardev.MicroLMS.repository.TeacherRepository;
import com.jaffardev.MicroLMS.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
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
    private final TeacherRepository teacherRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public User registerUser(RegisterUserRequest userRequest) {
        if (userRepository.existsByEmail(userRequest.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        Set<Role> roles = new HashSet<>();
        boolean isTeacherRole = false;

        for (Role roleFromRequest : userRequest.getRoles()) {
            Role role = roleRepository.findByName(roleFromRequest.getName())
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleFromRequest.getName()));
            if (role.getName().equals("ADMIN")) throw new RuntimeException("Invalid role!");
            if (role.getName().equals("TEACHER")) isTeacherRole = true;
            roles.add(role);
        }
        User user = isTeacherRole ? new Teacher() : new User();
        user.setEmail(userRequest.getEmail());
        user.setFullName(userRequest.getFullName());
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        user.setRoles(roles);
        user.setEnabled(false);  // not verified yet
        user.setVerificationCode(UUID.randomUUID().toString());
        User savedUser = (user instanceof Teacher)
                ? teacherRepository.save((Teacher) user)
                : userRepository.save(user);

        emailService.sendVerificationEmail(savedUser);
        return savedUser;
    }

    @Transactional()
    public User loginUser(LoginUserRequest userRequest) {
        User user = userRepository.findByEmail(userRequest.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        if (!passwordEncoder.matches(userRequest.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password.");
        }

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

        return user;
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

        if (updateUserRequest.getFullName() == null && updateUserRequest.getPassword() == null
        && updateUserRequest.getTitle() == null && updateUserRequest.getDepartment() == null){
            throw new RuntimeException("All fields are empty.");
        }
        if (updateUserRequest.getFullName() != null) {
            user.setFullName(updateUserRequest.getFullName());
        }
        if (updateUserRequest.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(updateUserRequest.getPassword()));
        }
        if (updateUserRequest.getDepartment() != null) {
            user.setDepartment(updateUserRequest.getDepartment());
        }

        if (updateUserRequest.getTitle() != null) {
            if (user instanceof Teacher teacher) {
                teacher.setTitle(updateUserRequest.getTitle());
            } else {
                // Optional: Throw error if a Student tries to set a title
                throw new IllegalArgumentException("Only teachers can have a professional title.");
            }
        }

        if (user instanceof Teacher teacher) {
            teacherRepository.save(teacher);
        } else {
            userRepository.save(user);
        }
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

    public Teacher getPublicInfo(Long userId) {
        return teacherRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
    }
}
