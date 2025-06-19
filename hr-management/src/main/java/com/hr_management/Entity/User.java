package com.hr_management.Entity;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String department; // Temporary storage for department name

    @Column(name = "join_date", nullable = false, updatable = false)
    private LocalDate joinDate = LocalDate.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id") // Maps to the department_id column in the users table
    private Department departmentEntity; // Reference to the Department entity

    @Column(nullable = false)
    private String role;

    @Column
    private String gender;

    @Embedded
    private LeaveBalance leaveBalance = new LeaveBalance(); // Initialize with default values

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "disapprove_reason")
    private String disapproveReason;

    @Column(name = "leave_without_payment", nullable = false)
    private Double leaveWithoutPayment = 0.0;

    @Column(name = "half_day_lwp", nullable = false)
    private Double halfDayLwp = 0.0;

    @ManyToOne
    @JoinColumn(name = "reporting_to")
    @JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
    private User reportingTo;

    @OneToMany(mappedBy = "reportingTo")
    @JsonManagedReference // Serialize subordinates, but avoid infinite recursion
    private List<User> subordinates;

    @Column(name = "employee_id", nullable = false, unique = true)
    private String employeeId;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDepartment() { return departmentEntity != null ? departmentEntity.getName() : department; }
    public void setDepartment(String department) { this.department = department; }
    public Department getDepartmentEntity() { return departmentEntity; }
    public void setDepartmentEntity(Department departmentEntity) {
        this.departmentEntity = departmentEntity;
        this.department = departmentEntity != null ? departmentEntity.getName() : null;
    }
    public LocalDate getJoinDate() { return joinDate; }
    public void setJoinDate(LocalDate joinDate) { this.joinDate = joinDate; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public LeaveBalance getLeaveBalance() { return leaveBalance; }
    public void setLeaveBalance(LeaveBalance leaveBalance) { this.leaveBalance = leaveBalance; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDisapproveReason() { return disapproveReason; }
    public void setDisapproveReason(String disapproveReason) { this.disapproveReason = disapproveReason; }
    public Double getLeaveWithoutPayment() { return leaveWithoutPayment; }
    public void setLeaveWithoutPayment(Double leaveWithoutPayment) { this.leaveWithoutPayment = leaveWithoutPayment; }
    public Double getHalfDayLwp() { return halfDayLwp; }
    public void setHalfDayLwp(Double halfDayLwp) { this.halfDayLwp = halfDayLwp; }
    public User getReportingTo() { return reportingTo; }
    public void setReportingTo(User reportingTo) { this.reportingTo = reportingTo; }
    public List<User> getSubordinates() { return subordinates; }
    public void setSubordinates(List<User> subordinates) { this.subordinates = subordinates; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
}