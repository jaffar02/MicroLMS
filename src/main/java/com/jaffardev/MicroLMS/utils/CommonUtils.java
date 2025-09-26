package com.jaffardev.MicroLMS.utils;

import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.util.Random;
import java.util.UUID;

import static com.jaffardev.MicroLMS.controllers.AssignmentController.ALLOWED_EXTENSIONS;

public class CommonUtils {

    public static String generateInviteCode() {
        String chars = "abcdefghjkmnpqrstuvwxyz23456789"; // no confusing chars
        int length = 7; // GCR-like length
        StringBuilder code = new StringBuilder();
        Random random = new SecureRandom();

        for (int i = 0; i < length; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }

        return code.toString();
    }

    public static boolean isValidFile(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) return false;

        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        return ALLOWED_EXTENSIONS.contains(ext);
    }
}
