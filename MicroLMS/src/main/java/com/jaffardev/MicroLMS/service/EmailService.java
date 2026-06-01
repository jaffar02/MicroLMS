package com.jaffardev.MicroLMS.service;

import com.jaffardev.MicroLMS.model.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    @Value("${app.frontend-url}")
    private String frontendUrl;

    public void sendSimpleEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    @Async
    public void sendSimpleEmailAsync(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = send HTML

            mailSender.send(message);
        } catch (MessagingException e) {
            log.error(e.getMessage());
            // You should log or rethrow the exception
        }
    }

    public void sendVerificationEmail(User user) {
        String toAddress = user.getEmail();
        String subject = "Please verify your registration";
        String content = "Dear [[name]],<br>"
                + "Please click the link below to verify your registration:<br>"
                + "<h3><a href=\"[[URL]]\" target=\"_self\">VERIFY</a></h3>"
                + "Thank you,<br>The Team.";

        content = content.replace("[[name]]", user.getFullName());
        String verifyURL = frontendUrl + "/verify?code=" + user.getVerificationCode();
        content = content.replace("[[URL]]", verifyURL);

        sendHtmlEmail(toAddress, subject, content);
    }

    public void sendPasswordResetEmail(User user) {
        // This link can point to your frontend reset page instead of backend
        String resetLink = frontendUrl + "/reset-password?code=" + user.getResetCode();
        String subject = "Password Reset Request";
        String body = "Click the link to reset your password: " + resetLink;
        sendSimpleEmail(user.getEmail(), subject, body);

        /* There on front end we can simply send req to reset password endpoint along with reset code and
           new password. */
    }

}
