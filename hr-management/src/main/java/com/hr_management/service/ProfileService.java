package com.hr_management.service;

import com.hr_management.Entity.Document;
import com.hr_management.Entity.User;
import com.hr_management.Repository.DocumentRepository;
import com.hr_management.Repository.UserRepository;
import com.hr_management.dto.ProfileDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    private final String uploadDir = "uploads/";

    public User getUserByUsername(String username) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }
        return user.get();
    }

    public ProfileDTO getProfileStatus(String username) {
        User user = getUserByUsername(username);
        ProfileDTO profileDTO = new ProfileDTO();
        profileDTO.setStatus(user.getProfileVerificationStatus());
        profileDTO.setDob(user.getDob() != null ? user.getDob().toString() : "");
        profileDTO.setFatherName(user.getFatherName());
        profileDTO.setMotherName(user.getMotherName());
        profileDTO.setIsFresher(user.getIsFresher());

        Map<String, String> documents = new HashMap<>();
        Map<String, String> previousCompanyDocuments = new HashMap<>();
        for (Document doc : documentRepository.findByUserId(user.getId())) {
            if (doc.getIsPreviousCompany()) {
                previousCompanyDocuments.put(doc.getDocumentType(), doc.getFilePath());
            } else {
                documents.put(doc.getDocumentType(), doc.getFilePath());
            }
        }
        profileDTO.setDocuments(documents);
        profileDTO.setPreviousCompanyDocuments(previousCompanyDocuments);
        return profileDTO;
    }

    public void submitProfile(String username, ProfileDTO profileDTO, MultipartFile photo,
                              Map<String, MultipartFile> documents, Map<String, MultipartFile> previousCompanyDocuments) {
        User user = getUserByUsername(username);

        if (user.getProfileVerificationStatus().equals("SUBMITTED") || user.getProfileVerificationStatus().equals("VERIFIED")) {
            throw new IllegalArgumentException("Profile already submitted or verified");
        }

        if (profileDTO.getDob() == null || profileDTO.getFatherName() == null ||
                profileDTO.getMotherName() == null || photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException("All required fields and photo must be provided");
        }

        if (documents == null || documents.isEmpty()) {
            throw new IllegalArgumentException("At least one document must be uploaded");
        }

        if (!profileDTO.getIsFresher() && (previousCompanyDocuments == null || previousCompanyDocuments.isEmpty())) {
            throw new IllegalArgumentException("At least one previous company document must be uploaded for non-freshers");
        }

        // Update user profile fields
        user.setDob(LocalDate.parse(profileDTO.getDob()));
        user.setFatherName(profileDTO.getFatherName());
        user.setMotherName(profileDTO.getMotherName());
        user.setIsFresher(profileDTO.getIsFresher());
        user.setProfileVerificationStatus("SUBMITTED");

        // Create upload directory if it doesn't exist
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        // Save profile photo
        if (!photo.isEmpty()) {
            String photoFileName = username + "_" + photo.getOriginalFilename();
            Path photoPath = Paths.get(uploadDir + photoFileName);
            try {
                Files.write(photoPath, photo.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                Document photoDoc = new Document();
                photoDoc.setUser(user);
                photoDoc.setDocumentType("photo");
                photoDoc.setFilePath("/uploads/" + photoFileName);
                documentRepository.save(photoDoc);
            } catch (IOException e) {
                throw new RuntimeException("Failed to save photo: " + e.getMessage());
            }
        }

        // Save documents
        if (documents != null) {
            for (Map.Entry<String, MultipartFile> entry : documents.entrySet()) {
                MultipartFile file = entry.getValue();
                if (!file.isEmpty()) {
                    String fileName = username + "_" + entry.getKey() + "_" + file.getOriginalFilename();
                    Path filePath = Paths.get(uploadDir + fileName);
                    try {
                        Files.write(filePath, file.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                        Document doc = new Document();
                        doc.setUser(user);
                        doc.setDocumentType(entry.getKey());
                        doc.setFilePath("/uploads/" + fileName);
                        documentRepository.save(doc);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to save document: " + e.getMessage());
                    }
                }
            }
        }

        // Save previous company documents
        if (previousCompanyDocuments != null && !profileDTO.getIsFresher()) {
            for (Map.Entry<String, MultipartFile> entry : previousCompanyDocuments.entrySet()) {
                MultipartFile file = entry.getValue();
                if (!file.isEmpty()) {
                    String fileName = username + "_" + entry.getKey() + "_" + file.getOriginalFilename();
                    Path filePath = Paths.get(uploadDir + fileName);
                    try {
                        Files.write(filePath, file.getBytes(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                        Document doc = new Document();
                        doc.setUser(user);
                        doc.setDocumentType(entry.getKey());
                        doc.setFilePath("/uploads/" + fileName);
                        doc.setIsPreviousCompany(true);
                        documentRepository.save(doc);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to save previous company document: " + e.getMessage());
                    }
                }
            }
        }

        userRepository.save(user);
    }
}