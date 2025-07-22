package com.hr_management.service;

import com.hr_management.Entity.Document;
import com.hr_management.Entity.User;
import com.hr_management.Repository.DocumentRepository;
import com.hr_management.Repository.UserRepository;
import com.hr_management.dto.ProfileDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    private final Path rootLocation = Paths.get("uploads");

    // These lists should match the frontend exactly
    private final List<String> documentTypes = Arrays.asList(
            "aadhaar", "pan", "marksheets", "offer_letter", "joining_form",
            "isa_form", "affidavit", "police_verification", "passbook_copy"
    );

    private final List<String> previousCompanyDocumentTypes = Arrays.asList(
            "experience_letter", "payslips", "relieving_letter"
    );

    public ProfileService() {
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    @Transactional
    public void submitProfile(String username, ProfileDTO profileDTO, Map<String, String> textParts, Map<String, MultipartFile> fileParts) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + username));

        if ("SUBMITTED".equals(user.getProfileVerificationStatus()) || "VERIFIED".equals(user.getProfileVerificationStatus())) {
            throw new IllegalStateException("Profile has already been submitted or verified and cannot be changed.");
        }

        // --- 1. Update User Entity Fields ---
        // IMPORTANT: Your User.java entity MUST have these fields and their setters.
        user.setDob(LocalDate.parse(profileDTO.getDob()));
        user.setFatherName(profileDTO.getFatherName());
        user.setMotherName(profileDTO.getMotherName());
        user.setEmergencyContactNumber(profileDTO.getEmergencyContactNumber());
        user.setIsFresher(profileDTO.getIsFresher());
        user.setProfileVerificationStatus("SUBMITTED");

        // --- 2. Process and Save All Files ---
        // Save Photo
        saveFileAndCreateDocument(user, fileParts.get("photo"), "photo", false, null);

        // Save Standard Documents
        for (String docType : documentTypes) {
            if (fileParts.containsKey(docType)) {
                saveFileAndCreateDocument(user, fileParts.get(docType), docType, false, null);
            }
        }

        // Save Previous Company Documents (if not a fresher)
        if (!profileDTO.getIsFresher()) {
            for (String docType : previousCompanyDocumentTypes) {
                if (fileParts.containsKey(docType)) {
                    saveFileAndCreateDocument(user, fileParts.get(docType), docType, true, null);
                }
            }
        }

        // Save Additional Documents
        for (Map.Entry<String, String> entry : textParts.entrySet()) {
            if (entry.getKey().startsWith("additionalDocument") && entry.getKey().endsWith("_name")) {
                String customDocName = entry.getValue();
                String fileKey = entry.getKey().replace("_name", "_file");
                MultipartFile file = fileParts.get(fileKey);
                if (file != null && !file.isEmpty() && customDocName != null && !customDocName.isEmpty()) {
                    saveFileAndCreateDocument(user, file, "additional_document", false, customDocName);
                }
            }
        }

        // --- 3. Save the updated User object ---
        userRepository.save(user);
    }

    private void saveFileAndCreateDocument(User user, MultipartFile file, String docType, boolean isPreviousCompany, String customDocName) {
        if (file == null || file.isEmpty()) {
            // Depending on requirements, you might throw an exception or just return
            // For now, we'll just return, assuming not all documents are mandatory
            return;
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String filename = user.getUsername() + "_" + docType + "_" + System.currentTimeMillis() + "_" + originalFilename;

        try {
            Path destinationFile = this.rootLocation.resolve(filename).normalize().toAbsolutePath();
            Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

            Document document = new Document();
            document.setUser(user);
            document.setDocumentType(docType);
            document.setFilePath(destinationFile.toString());
            document.setIsPreviousCompany(isPreviousCompany);

            if (customDocName != null && !customDocName.isEmpty()) {
                document.setCustomDocumentName(customDocName);
            }

            documentRepository.save(document);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + filename, e);
        }
    }
}