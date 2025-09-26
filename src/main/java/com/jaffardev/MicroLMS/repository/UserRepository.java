package com.jaffardev.MicroLMS.repository;

import com.jaffardev.MicroLMS.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    public Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    User findByVerificationCode(String code);

    User findByResetCode(String resetCode);
}
