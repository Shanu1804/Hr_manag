package com.hr_management.Controller;

import com.hr_management.dto.ProfileReviewDTO;
import com.hr_management.dto.UserProfileDetailDTO;
import com.hr_management.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr")
public class HrController {

    @Autowired
    private ProfileService profileService;

    @GetMapping("/user") // Adjust method and path as needed
    public ResponseEntity<?> getUser() {
        // Your logic here
        return ResponseEntity.ok("User data");
    }

    // --- NEW ENDPOINTS FOR PROFILE VERIFICATION ---

    @GetMapping("/profiles/verification")
    public ResponseEntity<List<ProfileReviewDTO>> getProfilesForVerification() {
        return ResponseEntity.ok(profileService.getProfilesForVerification());
    }

    @GetMapping("/profiles/{userId}")
    public ResponseEntity<UserProfileDetailDTO> getProfileDetails(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(profileService.getProfileDetailsForHr(userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/profiles/{userId}/approve")
    public ResponseEntity<?> approveProfile(@PathVariable Long userId) {
        try {
            profileService.approveProfile(userId);
            return ResponseEntity.ok(Map.of("message", "Profile approved successfully."));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/profiles/{userId}/reject")
    public ResponseEntity<?> rejectProfile(@PathVariable Long userId) {
        try {
            profileService.rejectProfile(userId);
            return ResponseEntity.ok(Map.of("message", "Profile rejected successfully."));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}