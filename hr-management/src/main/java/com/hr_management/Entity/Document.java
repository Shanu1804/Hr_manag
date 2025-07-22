package com.hr_management.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "document_type", nullable = false)
    private String documentType; // e.g., 'aadhaar', 'pan', 'additional_document'

    @Column(name = "custom_document_name") // New field for user-defined names
    private String customDocumentName;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "is_previous_company", nullable = false)
    private Boolean isPreviousCompany = false;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getCustomDocumentName() { return customDocumentName; }
    public void setCustomDocumentName(String customDocumentName) { this.customDocumentName = customDocumentName; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public Boolean getIsPreviousCompany() { return isPreviousCompany; }
    public void setIsPreviousCompany(Boolean isPreviousCompany) { this.isPreviousCompany = isPreviousCompany; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}