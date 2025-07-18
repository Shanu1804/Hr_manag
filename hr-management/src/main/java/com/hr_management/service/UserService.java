package com.hr_management.service;

import com.hr_management.Entity.Department;
import com.hr_management.Entity.PendingSignup; // Add import
import com.hr_management.Entity.User;
import com.hr_management.Entity.LeaveBalance;
import com.hr_management.Repository.DepartmentRepository;
import com.hr_management.Repository.PendingSignupRepository; // Add import
import com.hr_management.Repository.UserRepository;
import com.hr_management.Util.JwtUtil;
import com.hr_management.dto.ReportingPersonDTO;
import com.hr_management.dto.UserDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PendingSignupRepository pendingSignupRepository; // Add repository

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        logger.debug("Loading user by username: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        String role = "ROLE_" + user.getRole().toUpperCase();
        logger.debug("Assigning role: {} to user: {}", role, username);
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(), user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(role)));
    }

    public User getCurrentUser() {
        logger.info("Fetching current user");
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.debug("Username from SecurityContext: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    logger.error("User not found with username: {}", username);
                    return new UsernameNotFoundException("User not found with username: " + username);
                });
        logger.info("Fetched user: {}", user.getUsername());
        return user;
    }

    public String generateToken(User user) {
        return jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getDepartment());
    }

    public List<User> getEmployeesByDepartment(Long deptId) {
        Department department = departmentRepository.findById(deptId)
                .orElseThrow(() -> new RuntimeException("Department not found with id: " + deptId));
        String departmentName = department.getName();
        return userRepository.findByDepartment(departmentName);
    }

    public User findHodByDepartment(String departmentName) {
        return userRepository.findByDepartmentAndRole(departmentName, "HOD")
                .orElseThrow(() -> new RuntimeException("No HOD found for department: " + departmentName));
    }

    public User findDirector() {
        Optional<User> director = userRepository.findByRole("director").stream().findFirst();
        if (director.isEmpty()) {
            logger.error("No Director found in the system");
            throw new RuntimeException("No Director found");
        }
        return director.get();
    }

    public List<User> getHods() {
        return userRepository.findByRole("HOD");
    }

    public void updateUserStatus(Long id, String newStatus) {
        if (!newStatus.equals("ACTIVE") && !newStatus.equals("INACTIVE")) {
            throw new RuntimeException("Invalid status");
        }
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        User user = optionalUser.get();
        user.setStatus(newStatus);
        userRepository.save(user);
    }

    private String normalizeDepartment(String deptName) {
        if (deptName == null) return null;
        if (deptName.toLowerCase().contains("admin")) {
            return "Admin (Administration)"; // Match the exact database name
        }
        return deptName;
    }

    public List<ReportingPersonDTO> getPotentialReportingPersons(String role, String department) {
        logger.info("Fetching reporting persons for role: {}, department: {}", role, department);
        String normalizedDept = normalizeDepartment(department);
        logger.debug("Normalized department: {}", normalizedDept);

        if ((normalizedDept != null && normalizedDept.equals("Admin (Administration)") && role != null && role.equalsIgnoreCase("HR")) ||
                (role != null && role.equalsIgnoreCase("director"))) {
            logger.debug("No reporting persons required for role: {}, department: {}", role, normalizedDept);
            return Collections.emptyList();
        }

        List<User> users;
        switch (role.toUpperCase()) {
            case "EMPLOYEE":
                logger.debug("Querying users with role: PROJECT_MANAGER, department: {}, status: ACTIVE", normalizedDept);
                users = userRepository.findByRoleIgnoreCaseAndDepartmentAndStatus("PROJECT_MANAGER", normalizedDept, "ACTIVE");
                logger.debug("Found {} PROJECT_MANAGER users: {}", users.size(), users);
                break;
            case "PROJECT_MANAGER":
                logger.debug("Querying users with role: ASSISTANT_DIRECTOR, department: {}, status: ACTIVE", normalizedDept);
                users = userRepository.findByRoleIgnoreCaseAndDepartmentAndStatus("ASSISTANT_DIRECTOR", normalizedDept, "ACTIVE");
                logger.debug("Found {} ASSISTANT_DIRECTOR users: {}", users.size(), users);
                break;
            case "ASSISTANT_DIRECTOR":
                logger.debug("Querying users with role: DIRECTOR, status: ACTIVE");
                users = userRepository.findByRoleIgnoreCaseAndStatus("DIRECTOR", "ACTIVE");
                logger.debug("Found {} DIRECTOR users: {}", users.size(), users);
                break;
            default:
                logger.warn("No reporting persons for role: {}, department: {}", role, normalizedDept);
                users = Collections.emptyList();
        }
        List<ReportingPersonDTO> dtos = users.stream()
                .map(user -> new ReportingPersonDTO(user.getId(), user.getFullName(), user.getRole(), user.getEmail()))
                .collect(Collectors.toList());
        logger.info("Reporting persons found: {}", dtos);
        return dtos;
    }

    public PendingSignup signup(UserDTO userDTO) {
        logger.info("Processing signup for username: {}", userDTO.getUsername());
        // Check uniqueness in both users and pending_signups
        if (userRepository.existsByUsername(userDTO.getUsername()) || pendingSignupRepository.existsByUsername(userDTO.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepository.existsByEmail(userDTO.getEmail()) || pendingSignupRepository.existsByEmail(userDTO.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (userRepository.existsByEmployeeId(userDTO.getEmployeeId()) || pendingSignupRepository.existsByEmployeeId(userDTO.getEmployeeId())) {
            throw new IllegalArgumentException("Employee ID already registered");
        }

        if (userDTO.getJoinDate() == null) {
            throw new IllegalArgumentException("Join date is required");
        }

        if (!"director".equalsIgnoreCase(userDTO.getRole())) {
            if (userDTO.getDepartment() == null || userDTO.getDepartment().isBlank()) {
                throw new IllegalArgumentException("Department is required for non-Director roles");
            }
        } else {
            if (userDTO.getDepartment() != null && !userDTO.getDepartment().isBlank()) {
                throw new IllegalArgumentException("Department must be null for Director role");
            }
        }

        String normalizedDept = normalizeDepartment(userDTO.getDepartment());
        Department departmentEntity = null;
        if (!"director".equalsIgnoreCase(userDTO.getRole())) {
            departmentEntity = departmentRepository.findByName(normalizedDept)
                    .orElseThrow(() -> new IllegalArgumentException("Department not found: " + normalizedDept));
        }

        // Check if reporting person is required
        boolean isReportingPersonRequired = !(
                (normalizedDept != null && normalizedDept.equals("Admin (Administration)") && "HR".equalsIgnoreCase(userDTO.getRole())) ||
                        "director".equalsIgnoreCase(userDTO.getRole())
        );

        if (isReportingPersonRequired && userDTO.getReportingToId() == null) {
            throw new IllegalArgumentException("Reporting person is required for this role and department");
        }

        PendingSignup pendingSignup = new PendingSignup();
        pendingSignup.setFullName(userDTO.getFullName());
        pendingSignup.setUsername(userDTO.getUsername());
        pendingSignup.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        pendingSignup.setEmail(userDTO.getEmail());
        pendingSignup.setDepartment(normalizedDept);
        pendingSignup.setRole(userDTO.getRole().toUpperCase());
        pendingSignup.setGender(userDTO.getGender());
        pendingSignup.setJoinDate(userDTO.getJoinDate());
        pendingSignup.setEmployeeId(userDTO.getEmployeeId());
        pendingSignup.setStatus("PENDING");

        if (isReportingPersonRequired && userDTO.getReportingToId() != null) {
            User reportingTo = userRepository.findById(userDTO.getReportingToId())
                    .orElseThrow(() -> new IllegalArgumentException("Reporting person not found with ID: " + userDTO.getReportingToId()));
            pendingSignup.setReportingTo(reportingTo);
        } else {
            pendingSignup.setReportingTo(null);
        }

        PendingSignup savedPendingSignup = pendingSignupRepository.save(pendingSignup);
        logger.info("Signup request saved successfully: {}", savedPendingSignup.getUsername());
        return savedPendingSignup;
    }

    public List<PendingSignup> getPendingUsers() { // Change return type to List<PendingSignup>
        logger.info("Fetching pending signup requests");
        return pendingSignupRepository.findByStatus("PENDING");
    }

    public void approveUser(Long userId) {
        logger.info("Approving signup request with id: {}", userId);
        PendingSignup pendingSignup = pendingSignupRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Signup request not found with ID: " + userId));

        Department departmentEntity = null;
        if (!"DIRECTOR".equalsIgnoreCase(pendingSignup.getRole())) {
            departmentEntity = departmentRepository.findByName(pendingSignup.getDepartment())
                    .orElseThrow(() -> new IllegalArgumentException("Department not found: " + pendingSignup.getDepartment()));
        }

        LeaveBalance leaveBalance = new LeaveBalance();
        leaveBalance.setCasualLeaveUsed(0.0);
        leaveBalance.setCasualLeaveRemaining(pendingSignup.getRole().equalsIgnoreCase("ASSISTANT_DIRECTOR") ? 12.0 : 10.0);
        leaveBalance.setEarnedLeaveUsedFirstHalf(0.0);
        leaveBalance.setEarnedLeaveUsedSecondHalf(0.0);
        leaveBalance.setMaternityLeaveUsed(0.0);
        leaveBalance.setMaternityLeaveRemaining(pendingSignup.getGender().equalsIgnoreCase("Female") ? 182.0 : 0.0);
        leaveBalance.setPaternityLeaveUsed(0.0);
        leaveBalance.setPaternityLeaveRemaining(pendingSignup.getGender().equalsIgnoreCase("Male") ? 15.0 : 0.0);

        User user = new User();
        user.setFullName(pendingSignup.getFullName());
        user.setUsername(pendingSignup.getUsername());
        user.setPassword(pendingSignup.getPassword());
        user.setEmail(pendingSignup.getEmail());
        user.setDepartment(pendingSignup.getDepartment());
        user.setDepartmentEntity(departmentEntity);
        user.setRole(pendingSignup.getRole());
        user.setGender(pendingSignup.getGender());
        user.setJoinDate(pendingSignup.getJoinDate());
        user.setLeaveBalance(leaveBalance);
        user.setStatus("ACTIVE");
        user.setLeaveWithoutPayment(0.0);
        user.setHalfDayLwp(0.0);
        user.setEmployeeId(pendingSignup.getEmployeeId());
        user.setReportingTo(pendingSignup.getReportingTo());

        userRepository.save(user);
        pendingSignupRepository.delete(pendingSignup);
        emailService.sendSignupApprovalEmail(pendingSignup.getEmail(), pendingSignup.getFullName());
    }

    public void rejectUser(Long userId, String reason) {
        logger.info("Rejecting signup request with id: {}", userId);
        PendingSignup pendingSignup = pendingSignupRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Signup request not found with ID: " + userId));
        pendingSignup.setStatus("REJECTED");
        pendingSignup.setReason(reason);
        pendingSignupRepository.save(pendingSignup);
        emailService.sendSignupRejectionEmail(pendingSignup.getEmail(), pendingSignup.getFullName(), reason);
    }

    public void deletePendingSignup(Long userId) { // New method for deletion
        logger.info("Deleting signup request with id: {}", userId);
        PendingSignup pendingSignup = pendingSignupRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Signup request not found with ID: " + userId));
        pendingSignupRepository.delete(pendingSignup);
        emailService.sendSignupRejectionEmail(pendingSignup.getEmail(), pendingSignup.getFullName(), "Signup request was deleted by HR.");
    }
}