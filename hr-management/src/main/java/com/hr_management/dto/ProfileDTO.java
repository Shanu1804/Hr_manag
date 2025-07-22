package com.hr_management.dto;

public class ProfileDTO {
    private String dob;
    private String fatherName;
    private String motherName;
    private String emergencyContactNumber;
    private Boolean isFresher;

    // Getters and Setters
    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    public String getFatherName() { return fatherName; }
    public void setFatherName(String fatherName) { this.fatherName = fatherName; }
    public String getMotherName() { return motherName; }
    public void setMotherName(String motherName) { this.motherName = motherName; }
    public String getEmergencyContactNumber() { return emergencyContactNumber; }
    public void setEmergencyContactNumber(String emergencyContactNumber) { this.emergencyContactNumber = emergencyContactNumber; }
    public Boolean getIsFresher() { return isFresher; }
    public void setIsFresher(Boolean isFresher) { this.isFresher = isFresher; }
}