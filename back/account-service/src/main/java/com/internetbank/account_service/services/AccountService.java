package com.internetbank.account_service.services;

import com.internetbank.account_service.dtos.AccountCreateRequest;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.dtos.AccountTransactionDTO;
import com.internetbank.account_service.dtos.MoneyOperationRequest;
import com.internetbank.account_service.dtos.RenameAccountRequest;
import com.internetbank.account_service.enums.AccountStatus;
import com.internetbank.account_service.enums.TransactionType;
import com.internetbank.common.dtos.UserDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AccountService {
    AccountDTO createAccount(UUID userId, AccountCreateRequest request);

    void closeAccount(UUID accountId, UserDTO user);

    AccountDTO openAccount(UUID accountId, UserDTO user);

    void deleteAccount(UUID accountId);

    AccountDTO deposit(UUID accountId, MoneyOperationRequest request, UserDTO user);

    AccountDTO withdraw(UUID accountId, MoneyOperationRequest request, UserDTO user);

    AccountDTO rename(UUID accountId, RenameAccountRequest request, UserDTO user);

    AccountDTO getAccountById(UUID accountId, UserDTO user);

    Page<AccountDTO> getUserAccounts(UUID userId, Pageable pageable, List<AccountStatus> statuses);

    Page<AccountDTO> getAllAccounts(Pageable pageable, List<AccountStatus> statuses);

    Page<AccountTransactionDTO> getTransactions(UUID accountId,
                                                UserDTO user,
                                                Pageable pageable,
                                                LocalDateTime fromDate,
                                                LocalDateTime toDate,
                                                TransactionType type);
}

