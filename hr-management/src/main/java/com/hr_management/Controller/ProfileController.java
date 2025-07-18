package com.hr_management.Controller;

import com.hr_management.Entity.Document;
import com.hr_management.dto.ProfileDTO;
import com.hr_management.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping("/profile-status")
    public ResponseEntity<?> getProfileStatus(Authentication authentication) {
        try {
            String username = authentication.getName();
            ProfileDTO profileDTO = profileService.getProfileStatus(username);
            return ResponseEntity.ok(profileDTO);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("Failed to fetch profile status: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/profile", consumes = {"multipart/form-data"})
    public ResponseEntity<?> submitProfile(
            Authentication authentication,
            @RequestPart("dob") String dob,
            @RequestPart("fatherName") String fatherName,
            @RequestPart("motherName") String motherName,
            @RequestPart("isFresher") String isFresher,
            @RequestPart(value = "photo", required = true) MultipartFile photo,
            @RequestPart(value = "documents.offer_letter", required = false) MultipartFile offerLetter,
            @RequestPart(value = "documents.joining_form", required = false) MultipartFile joiningForm,
            @RequestPart(value = "documents.ISA_affidavit", required = false) MultipartFile isaAffidavit,
            @RequestPart(value = "documents.police_verification", required = false) MultipartFile policeVerification,
            @RequestPart(value = "documents.Aadhaar", required = false) MultipartFile aadhaar,
            @RequestPart(value = "documents.Pan", required = false) MultipartFile pan,
            @RequestPart(value = "documents.passbook", required = false) MultipartFile passbook,
            @RequestPart(value = "documents.qualification_degree_certificate", required = false) MultipartFile qualificationDegreeCertificate,
            @RequestPart(value = "documents.experience_letter", required = false) MultipartFile experienceLetter,
            @RequestPart(value = "documents.LC_sign_stamp_document", required = false) MultipartFile lcSignStampDocument,
            @RequestPart(value = "previousCompanyDocuments.previous_experience_letter", required = false) MultipartFile previousExperienceLetter,
            @RequestPart(value = "previousCompanyDocuments.relieving_letter", required = false) MultipartFile relievingLetter,
            @RequestPart(value = "previousCompanyDocuments.payslip", required = false) MultipartFile payslip,
            @RequestPart(value = "previousCompanyDocuments.reference_letter", required = false) MultipartFile referenceLetter) {
        try {
            String username = authentication.getName();
            ProfileDTO profileDTO = new ProfileDTO();
            profileDTO.setDob(dob);
            profileDTO.setFatherName(fatherName);
            profileDTO.setMotherName(motherName);
            profileDTO.setIsFresher(Boolean.parseBoolean(isFresher));

            // Construct documents map
            Map<String, MultipartFile> documents = new HashMap<>();
            if (offerLetter != null && !offerLetter.isEmpty()) documents.put("offer_letter", offerLetter);
            if (joiningForm != null && !joiningForm.isEmpty()) documents.put("joining_form", joiningForm);
            if (isaAffidavit != null && !isaAffidavit.isEmpty()) documents.put("ISA_affidavit", isaAffidavit);
            if (policeVerification != null && !policeVerification.isEmpty()) documents.put("police_verification", policeVerification);
            if (aadhaar != null && !aadhaar.isEmpty()) documents.put("Aadhaar", aadhaar);
            if (pan != null && !pan.isEmpty()) documents.put("Pan", pan);
            if (passbook != null && !passbook.isEmpty()) documents.put("passbook", passbook);
            if (qualificationDegreeCertificate != null && !qualificationDegreeCertificate.isEmpty()) documents.put("qualification_degree_certificate", qualificationDegreeCertificate);
            if (experienceLetter != null && !experienceLetter.isEmpty()) documents.put("experience_letter", experienceLetter);
            if (lcSignStampDocument != null && !lcSignStampDocument.isEmpty()) documents.put("LC_sign_stamp_document", lcSignStampDocument);

            // Construct previousCompanyDocuments map
            Map<String, MultipartFile> previousCompanyDocuments = new HashMap<>();
            if (previousExperienceLetter != null && !previousExperienceLetter.isEmpty()) previousCompanyDocuments.put("previous_experience_letter", previousExperienceLetter);
            if (relievingLetter != null && !relievingLetter.isEmpty()) previousCompanyDocuments.put("relieving_letter", relievingLetter);
            if (payslip != null && !payslip.isEmpty()) previousCompanyDocuments.put("payslip", payslip);
            if (referenceLetter != null && !referenceLetter.isEmpty()) previousCompanyDocuments.put("reference_letter", referenceLetter);

            profileService.submitProfile(username, profileDTO, photo, documents, previousCompanyDocuments);
            return ResponseEntity.ok(new SuccessResponse("Profile submitted successfully for HR verification."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse("An error occurred: " + e.getMessage()));
        }
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