package com.internetbank.db.repository;

import com.internetbank.db.model.Loan;
import com.internetbank.db.model.enums.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface LoanRepository extends JpaRepository<Loan, UUID> {

    Page<Loan> findByUserId(UUID userId, Pageable pageable);

    Page<Loan> findByUserIdAndStatus(UUID userId, LoanStatus status, Pageable pageable);

    List<Loan> findByUserIdAndStatus(UUID userId, LoanStatus status);

    Page<Loan> findByStatus(LoanStatus status, Pageable pageable);

    @Query("SELECT l FROM Loan l WHERE (l.status = 'ACTIVE' OR l.status = 'OVERDUE') AND l.nextPaymentDate <= :date")
    List<Loan> findDuePayments(@Param("date") LocalDate date);

    @Query(value = "SELECT l FROM Loan l WHERE l.status = :status ORDER BY l.createdAt ASC")
    List<Loan> findByStatusWithLimit(@Param("status") LoanStatus status);
}
