package com.jaffardev.MicroLMS.utils;

import java.security.SecureRandom;
import java.util.Random;
import java.util.UUID;

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
}
