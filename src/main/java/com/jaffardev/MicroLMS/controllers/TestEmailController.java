package com.jaffardev.MicroLMS.controllers;

import com.jaffardev.MicroLMS.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class TestEmailController {
    private final EmailService emailService;
    @GetMapping("/send-test-email")
    public String sendTestEmail() {
        emailService.sendSimpleEmail(
                "a33329926@gmail.com",
                "Test Email from MicroLMS",
                "Hello, this is a test email."
        );
        return "Email sent!";
    }
}