package com.jaffardev.MicroLMS.service;

import com.jaffardev.MicroLMS.dto.LoginUserRequest;
import com.jaffardev.MicroLMS.dto.RegisterUserRequest;
import com.jaffardev.MicroLMS.model.Role;
import com.jaffardev.MicroLMS.model.User;
import com.jaffardev.MicroLMS.repository.RoleRepository;
import com.jaffardev.MicroLMS.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(RegisterUserRequest userRequest) {
        // TODO Add user to db but first check if same exist through email.
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
            roles.add(role);
        }
        user.setRoles(roles);

        return userRepository.save(user);
    }

    public User loginUser(LoginUserRequest userRequest) {
        // TODO Add user to db but first check if same exist through email.
        User user = userRepository.findByEmail(userRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if(passwordEncoder.matches(userRequest.getPassword(), user.getPassword())) {
            return user;
        }
        return null;
    }
}
