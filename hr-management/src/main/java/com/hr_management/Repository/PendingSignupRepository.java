package com.hr_management.Repository;

import com.hr_management.Entity.PendingSignup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PendingSignupRepository extends JpaRepository<PendingSignup, Long> {
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByEmployeeId(String employeeId);
    List<PendingSignup> findByStatus(String status);
    List<PendingSignup> findByRoleIgnoreCaseAndStatus(String role, String status);
}