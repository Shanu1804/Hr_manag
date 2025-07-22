package com.hr_management.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${frontend.url}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("BISAG-N HR System - Password Reset Request");
        message.setText("Dear User,\n\n" +
                "You requested a password reset for your BISAG-N HR Management System account.\n" +
                "Please click the following link to reset your password:\n" +
                frontendUrl + "/reset-password?token=" + token + "\n\n" +
                "This link will expire in 1 hour. If you did not request a password reset, please ignore this email.\n\n" +
                "Best regards,\nBISAG-N Team");
        message.setFrom(fromEmail);
        mailSender.send(message);
    }

    public void sendSignupConfirmationEmail(String toEmail, String fullName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("BISAG-N HR System - Signup Request Submitted");
        message.setText("Dear " + fullName + ",\n\n" +
                "Your signup request for the BISAG-N HR Management System has been successfully submitted.\n" +
                "It is currently awaiting approval from our HR team. You will be notified once your account is reviewed.\n\n" +
                "Best regards,\nBISAG-N Team");
        message.setFrom(fromEmail);
        mailSender.send(message);
    }
    public void sendHrSignupConfirmationEmail(String toEmail, String fullName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("BISAG-N HR System - HR Signup Request Submitted");
        message.setText("Dear " + fullName + ",\n\n" +
                "Your HR signup request for the BISAG-N HR Management System has been successfully submitted.\n" +
                "It is currently awaiting approval from our admin team. You will be notified once your HR account is reviewed.\n\n" +
                "Best regards,\nBISAG-N Team");
        message.setFrom(fromEmail);
        mailSender.send(message);
    }

    public void sendSignupApprovalEmail(String toEmail, String fullName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("BISAG-N HR System - Account Approved");
        message.setText("Dear " + fullName + ",\n\n" +
                "Congratulations! Your account for the BISAG-N HR Management System has been approved.\n" +
                "You can now log in using your credentials at: " + frontendUrl + "\n\n" +
                "Best regards,\nBISAG-N Team");
        message.setFrom(fromEmail);
        mailSender.send(message);
    }

    public void sendSignupRejectionEmail(String toEmail, String fullName, String reason) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("BISAG-N HR System - Account Request Rejected");
        message.setText("Dear " + fullName + ",\n\n" +
                "We regret to inform you that your signup request for the BISAG-N HR Management System has been rejected.\n" +
                "Reason: " + reason + "\n\n" +
                "If you have any questions, please contact our HR team.\n\n" +
                "Best regards,\nBISAG-N Team");
        message.setFrom(fromEmail);
        mailSender.send(message);
    }
}