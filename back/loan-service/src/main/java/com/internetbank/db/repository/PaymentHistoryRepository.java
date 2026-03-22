package com.internetbank.db.repository;

import com.internetbank.db.model.PaymentHistory;
import com.internetbank.db.model.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, UUID> {

    Page<PaymentHistory> findByLoanId(UUID loanId, Pageable pageable);

    Page<PaymentHistory> findByLoanIdAndStatus(UUID loanId, PaymentStatus status, Pageable pageable);

    @Query("SELECT ph FROM PaymentHistory ph WHERE ph.userId = :userId AND ph.status = :status")
    Page<PaymentHistory> findOverduePayments(@Param("userId") UUID userId, @Param("status") PaymentStatus status, Pageable pageable);

    @Query("SELECT COUNT(ph) FROM PaymentHistory ph WHERE ph.userId = :userId AND ph.status IN :lateStatuses")
    long countLatePayments(@Param("userId") UUID userId, @Param("lateStatuses") List<PaymentStatus> lateStatuses);

    @Query("SELECT COALESCE(SUM(ph.penaltyAmount), 0) FROM PaymentHistory ph WHERE ph.userId = :userId AND ph.penaltyAmount IS NOT NULL")
    BigDecimal getTotalPenalties(@Param("userId") UUID userId);

    @Query("SELECT ph FROM PaymentHistory ph WHERE ph.userId = :userId AND ph.status IN :overdueStatuses ORDER BY ph.expectedPaymentDate DESC")
    Page<PaymentHistory> findOverduePaymentsByUser(@Param("userId") UUID userId,
                                                   @Param("overdueStatuses") List<PaymentStatus> overdueStatuses,
                                                   Pageable pageable);

    @Query("SELECT ph FROM PaymentHistory ph WHERE ph.loanId = :loanId AND ph.status IN :overdueStatuses ORDER BY ph.expectedPaymentDate DESC")
    Page<PaymentHistory> findOverduePaymentsByLoan(@Param("loanId") UUID loanId,
                                                   @Param("overdueStatuses") List<PaymentStatus> overdueStatuses,
                                                   Pageable pageable);

    @Query("SELECT COALESCE(SUM(ph.paymentAmount), 0) FROM PaymentHistory ph WHERE ph.userId = :userId AND ph.status IN :overdueStatuses")
    BigDecimal getTotalOverdueAmount(@Param("userId") UUID userId,
                                     @Param("overdueStatuses") List<PaymentStatus> overdueStatuses);

    @Query("SELECT MAX(ph.expectedPaymentDate) FROM PaymentHistory ph WHERE ph.userId = :userId AND ph.status IN :overdueStatuses")
    LocalDate getLastOverdueDate(@Param("userId") UUID userId,
                                 @Param("overdueStatuses") List<PaymentStatus> overdueStatuses);
}