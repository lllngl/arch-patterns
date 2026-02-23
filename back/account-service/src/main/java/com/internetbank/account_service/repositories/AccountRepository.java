package com.internetbank.account_service.repositories;

import com.internetbank.account_service.enums.AccountStatus;
import com.internetbank.account_service.models.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {
    Page<Account> findByUserId(UUID userId, Pageable pageable);

    Page<Account> findByUserIdAndStatusIn(UUID userId, Collection<AccountStatus> statuses, Pageable pageable);

    Page<Account> findByStatusIn(Collection<AccountStatus> statuses, Pageable pageable);
}

