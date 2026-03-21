package com.internetbank.account_service.services;

import com.internetbank.account_service.dtos.AccountCreateRequest;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.dtos.AccountTransactionDTO;
import com.internetbank.account_service.dtos.MoneyOperationRequest;
import com.internetbank.account_service.dtos.RenameAccountRequest;
import com.internetbank.account_service.dtos.TransferRequest;
import com.internetbank.account_service.dtos.TransferResponse;
import com.internetbank.account_service.enums.AccountStatus;
import com.internetbank.account_service.enums.TransactionType;
import com.internetbank.common.security.AuthenticatedUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AccountService {
    AccountDTO createAccount(UUID userId, AccountCreateRequest request);

    void closeAccount(UUID accountId, AuthenticatedUser user);

    AccountDTO openAccount(UUID accountId, AuthenticatedUser user);

    void deleteAccount(UUID accountId);

    AccountDTO deposit(UUID accountId, MoneyOperationRequest request, AuthenticatedUser user);

    AccountDTO withdraw(UUID accountId, MoneyOperationRequest request, AuthenticatedUser user);

    TransferResponse transfer(TransferRequest request, AuthenticatedUser user);

    AccountDTO rename(UUID accountId, RenameAccountRequest request, AuthenticatedUser user);

    AccountDTO getAccountById(UUID accountId, AuthenticatedUser user);

    Page<AccountDTO> getUserAccounts(UUID userId, Pageable pageable, List<AccountStatus> statuses);

    Page<AccountDTO> getAllAccounts(Pageable pageable, List<AccountStatus> statuses);

    Page<AccountTransactionDTO> getTransactions(UUID accountId,
                                                AuthenticatedUser user,
                                                Pageable pageable,
                                                LocalDateTime fromDate,
                                                LocalDateTime toDate,
                                                TransactionType type);
}

