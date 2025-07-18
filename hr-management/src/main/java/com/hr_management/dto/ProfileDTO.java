package com.hr_management.dto;

import java.util.Map;

public class ProfileDTO {
    private String status;
    private String dob;
    private String fatherName;
    private String motherName;
    private Boolean isFresher;
    private Map<String, String> documents;
    private Map<String, String> previousCompanyDocuments;

    // Getters and Setters
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    public String getFatherName() { return fatherName; }
    public void setFatherName(String fatherName) { this.fatherName = fatherName; }
    public String getMotherName() { return motherName; }
    public void setMotherName(String motherName) { this.motherName = motherName; }
    public Boolean getIsFresher() { return isFresher; }
    public void setIsFresher(Boolean isFresher) { this.isFresher = isFresher; }
    public Map<String, String> getDocuments() { return documents; }
    public void setDocuments(Map<String, String> documents) { this.documents = documents; }
    public Map<String, String> getPreviousCompanyDocuments() { return previousCompanyDocuments; }
    public void setPreviousCompanyDocuments(Map<String, String> previousCompanyDocuments) {
        this.previousCompanyDocuments = previousCompanyDocuments;
    }
}