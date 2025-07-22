package com.hr_management.Controller;

import com.hr_management.Entity.PendingSignup;
import com.hr_management.Entity.User;
import com.hr_management.Repository.UserRepository;
import com.hr_management.Util.JwtUtil;
import com.hr_management.service.EmailService;
import com.hr_management.Entity.PasswordResetToken;
import com.hr_management.Repository.PasswordResetTokenRepository;
import com.hr_management.service.UserService;
import com.hr_management.dto.ReportingPersonDTO;
import com.hr_management.dto.UserDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserService userService;

    @GetMapping("/reporting-persons")
    public ResponseEntity<?> getReportingPersons(@RequestParam String role, @RequestParam(required = false) String department) {
        try {
            List<ReportingPersonDTO> reportingPersons = userService.getPotentialReportingPersons(role, department);
            return ResponseEntity.ok(reportingPersons);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Failed to fetch reporting persons: " + e.getMessage()));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to fetch users: " + e.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody UserDTO userDTO) {
        try {
            Object result = userService.signup(userDTO);
            if (result instanceof User) {
                return ResponseEntity.ok(new SuccessResponse("Account created successfully by Super Admin."));
            } else if (result instanceof PendingSignup) {
                PendingSignup pendingSignup = (PendingSignup) result;
                String message = "HR".equalsIgnoreCase(pendingSignup.getRole()) && "Admin (Administration)".equals(pendingSignup.getDepartment())
                        ? "HR signup request submitted successfully. Awaiting Super Admin approval."
                        : "Signup request submitted successfully. Awaiting HR approval.";
                return ResponseEntity.ok(new SuccessResponse(message));
            } else {
                // This case should ideally not be reached
                throw new IllegalStateException("Unexpected result type from signup service");
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ErrorResponse("An error occurred: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Optional<User> optionalUser = userRepository.findByUsername(request.getUsername());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid username or password"));
        }

        User user = optionalUser.get();

        // Check status
        if (!user.getStatus().equals("ACTIVE")) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Account not approved or rejected"));
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid username or password"));
        }

        // Generate token
        String role = user.getRole().toUpperCase();
        String token = userService.generateToken(user);
        return ResponseEntity.ok(new LoginResponse(token, role));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("No account found with this email"));
        }

        User user = optionalUser.get();
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(1));
        tokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(request.getEmail(), token);
        return ResponseEntity.ok(new SuccessResponse("Password reset email sent successfully"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        PasswordResetToken resetToken = tokenRepository.findByToken(request.getToken());
        if (resetToken == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid or expired reset token"));
        }

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken);
            return ResponseEntity.badRequest().body(new ErrorResponse("Reset token has expired"));
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Passwords do not match"));
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        tokenRepository.delete(resetToken);
        return ResponseEntity.ok(new SuccessResponse("Password reset successfully"));
    }

    // --- Static Inner Classes for Request/Response Payloads ---

    static class LoginRequest {
        @NotBlank
        private String username;
        @NotBlank
        private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    static class LoginResponse {
        private String token;
        private String role;

        public LoginResponse(String token, String role) {
            this.token = token;
            this.role = role;
        }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    static class ForgotPasswordRequest {
        @NotBlank
        @Email
        private String email;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    static class ResetPasswordRequest {
        @NotBlank
        private String token;
        @NotBlank
        private String password;
        @NotBlank
        private String confirmPassword;

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getConfirmPassword() { return confirmPassword; }
        public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
    }

    static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) { this.message = message; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    static class SuccessResponse {
        private String message;

        public SuccessResponse(String message) { this.message = message; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}