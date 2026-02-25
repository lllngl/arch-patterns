package com.internetbank.db.repository;

import com.internetbank.db.model.AccountLoan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AccountLoanRepository extends JpaRepository<AccountLoan, UUID> {
}
