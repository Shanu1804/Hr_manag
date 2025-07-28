package com.hr_management.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class UserProfileDetailDTO {
    // User details
    private Long userId;
    private String fullName;
    private String email;
    private String employeeId;
    private LocalDate dob;
    private String fatherName;
    private String motherName;
    private String emergencyContactNumber;
    private Boolean isFresher;
    private String profileVerificationStatus;

    // Documents
    private List<DocumentDTO> documents;
}