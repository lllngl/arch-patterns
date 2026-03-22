package com.internetbank.account_service.repositories;

import com.internetbank.account_service.enums.AccountStatus;
import com.internetbank.account_service.enums.AccountType;
import com.internetbank.account_service.models.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {
    Page<Account> findByUserId(UUID userId, Pageable pageable);

    Page<Account> findByUserIdAndStatusIn(UUID userId, Collection<AccountStatus> statuses, Pageable pageable);

    Page<Account> findByStatusIn(Collection<AccountStatus> statuses, Pageable pageable);

    Page<Account> findByUserIdAndStatusInAndType(UUID userId,
                                                 Collection<AccountStatus> statuses,
                                                 AccountType type,
                                                 Pageable pageable);

    Page<Account> findByStatusInAndType(Collection<AccountStatus> statuses,
                                        AccountType type,
                                        Pageable pageable);

    Optional<Account> findByType(AccountType type);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Account a where a.id = :accountId")
    Optional<Account> findByIdForUpdate(@Param("accountId") UUID accountId);
}

