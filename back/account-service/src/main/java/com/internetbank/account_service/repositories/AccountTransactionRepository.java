package com.internetbank.account_service.repositories;

import com.internetbank.account_service.enums.TransactionType;
import com.internetbank.account_service.models.AccountTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface AccountTransactionRepository extends JpaRepository<AccountTransaction, UUID> {
    @Query("""
            SELECT t
            FROM AccountTransaction t
            WHERE t.accountId = :accountId
            AND (:type IS NULL OR t.type = :type)
            AND t.createdAt >= :fromDate
            AND t.createdAt <= :toDate
            """)
    Page<AccountTransaction> findWithFilters(@Param("accountId") UUID accountId,
                                             @Param("type") TransactionType type,
                                             @Param("fromDate") LocalDateTime fromDate,
                                             @Param("toDate") LocalDateTime toDate,
                                             Pageable pageable);
}



