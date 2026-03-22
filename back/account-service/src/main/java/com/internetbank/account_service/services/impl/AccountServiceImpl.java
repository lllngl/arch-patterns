package com.internetbank.account_service.services.impl;

import com.internetbank.account_service.configs.BankProperties;
import com.internetbank.account_service.dtos.AccountCreateRequest;
import com.internetbank.account_service.dtos.MoneyOperationRequest;
import com.internetbank.account_service.dtos.RenameAccountRequest;
import com.internetbank.account_service.dtos.TransferRequest;
import com.internetbank.account_service.enums.AccountStatus;
import com.internetbank.account_service.enums.AccountType;
import com.internetbank.account_service.enums.TransactionType;
import com.internetbank.account_service.mappers.AccountMapper;
import com.internetbank.account_service.mappers.AccountTransactionMapper;
import com.internetbank.account_service.messaging.AccountOperationCommand;
import com.internetbank.account_service.messaging.AccountOperationCommandType;
import com.internetbank.account_service.messaging.AccountOperationProducer;
import com.internetbank.account_service.messaging.OperationCommandInitiator;
import com.internetbank.account_service.models.Account;
import com.internetbank.account_service.repositories.AccountRepository;
import com.internetbank.account_service.repositories.AccountTransactionRepository;
import com.internetbank.account_service.services.AccountOperationProcessingService;
import com.internetbank.account_service.services.AccountService;
import com.internetbank.common.clients.UserAppClient;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.dtos.AccountTransactionDTO;
import com.internetbank.common.dtos.OperationAcceptedResponse;
import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.enums.CurrencyCode;
import com.internetbank.common.enums.RoleName;
import com.internetbank.common.exceptions.BadRequestException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.common.security.AuthenticatedUser;
import com.internetbank.common.security.ResourceAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private static final String DEFAULT_ACCOUNT_NAME = "Default account";

    private final AccountRepository accountRepository;
    private final AccountTransactionRepository accountTransactionRepository;
    private final AccountMapper accountMapper;
    private final AccountTransactionMapper accountTransactionMapper;
    private final UserAppClient userAppClient;
    private final ResourceAccessService resourceAccessService;
    private final BankProperties bankProperties;
    private final AccountOperationProcessingService operationProcessingService;
    private final AccountOperationProducer operationProducer;

    @Override
    @Transactional
    public AccountDTO createAccount(UUID userId, AccountCreateRequest request) {
        UserDTO targetUser = userAppClient.getUserById(userId);
        if (!targetUser.hasRole(RoleName.CLIENT)) {
            throw new BadRequestException("Cannot create an account for a user without the CLIENT role.");
        }

        Account account = accountMapper.toEntity(request == null ? new AccountCreateRequest(null, null) : request);
        account.setUserId(userId);
        account.setBalance(BigDecimal.ZERO);
        account.setName(resolveAccountName(request));
        account.setCurrency(resolveAccountCurrency(request));
        account.setStatus(AccountStatus.OPEN);
        account.setType(AccountType.CUSTOMER);

        return accountMapper.toDto(accountRepository.saveAndFlush(account));
    }

    @Override
    @Transactional
    public void closeAccount(UUID accountId, AuthenticatedUser user) {
        Account account = getVisibleAuthorizedAccount(accountId, user);
        if (account.getStatus() == AccountStatus.CLOSED) {
            throw new BadRequestException("Account is already closed.");
        }
        if (account.getBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new BadRequestException("Account can be closed only when balance is 0.");
        }
        account.setStatus(AccountStatus.CLOSED);
        accountRepository.saveAndFlush(account);
    }

    @Override
    @Transactional
    public AccountDTO openAccount(UUID accountId, AuthenticatedUser user) {
        Account account = getVisibleAuthorizedAccount(accountId, user);
        if (account.getStatus() == AccountStatus.OPEN) {
            throw new BadRequestException("Account is already open.");
        }
        account.setStatus(AccountStatus.OPEN);
        return accountMapper.toDto(accountRepository.saveAndFlush(account));
    }

    @Override
    @Transactional
    public void deleteAccount(UUID accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new NotFoundException("Account not found with ID: " + accountId));
        ensureVisibleAccount(account);
        accountRepository.delete(account);
    }

    @Override
    public OperationAcceptedResponse deposit(UUID accountId, MoneyOperationRequest request, AuthenticatedUser user) {
        operationProcessingService.validateDeposit(accountId, request, user);
        return enqueueCommand(AccountOperationCommandType.DEPOSIT, accountId, null, request.amount(), request.operationCurrency(), user);
    }

    @Override
    public OperationAcceptedResponse withdraw(UUID accountId, MoneyOperationRequest request, AuthenticatedUser user) {
        operationProcessingService.validateWithdraw(accountId, request, user);
        return enqueueCommand(AccountOperationCommandType.WITHDRAW, accountId, null, request.amount(), request.operationCurrency(), user);
    }

    @Override
    public OperationAcceptedResponse transfer(TransferRequest request, AuthenticatedUser user) {
        operationProcessingService.validateTransfer(request, user);
        return enqueueCommand(
                AccountOperationCommandType.TRANSFER,
                request.fromAccountId(),
                request.toAccountId(),
                request.amount(),
                request.operationCurrency(),
                user
        );
    }

    @Override
    @Transactional
    public AccountDTO rename(UUID accountId, RenameAccountRequest request, AuthenticatedUser user) {
        Account account = getVisibleOpenAuthorizedAccount(accountId, user);
        account.setName(request.name().trim());
        return accountMapper.toDto(accountRepository.saveAndFlush(account));
    }

    @Override
    @Transactional(readOnly = true)
    public AccountDTO getAccountById(UUID accountId, AuthenticatedUser user) {
        Account account = getVisibleAuthorizedAccount(accountId, user);
        return accountMapper.toDto(account);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccountDTO> getUserAccounts(UUID userId, Pageable pageable, List<AccountStatus> statuses) {
        ensureUserExists(userId);
        return accountRepository.findByUserIdAndStatusInAndType(userId, resolveStatuses(statuses), AccountType.CUSTOMER, pageable)
                .map(accountMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccountDTO> getAllAccounts(Pageable pageable, List<AccountStatus> statuses) {
        return accountRepository.findByStatusInAndType(resolveStatuses(statuses), AccountType.CUSTOMER, pageable)
                .map(accountMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AccountTransactionDTO> getTransactions(UUID accountId,
                                                       AuthenticatedUser user,
                                                       Pageable pageable,
                                                       LocalDateTime fromDate,
                                                       LocalDateTime toDate,
                                                       TransactionType type) {
        getVisibleAuthorizedAccount(accountId, user);
        LocalDateTime from = fromDate != null ? fromDate : LocalDateTime.of(1, 1, 1, 0, 0);
        LocalDateTime to = toDate != null ? toDate : LocalDateTime.of(9999, 12, 31, 23, 59, 59);
        return accountTransactionRepository.findWithFilters(accountId, type, from, to, pageable)
                .map(accountTransactionMapper::toDto);
    }

    private OperationAcceptedResponse enqueueCommand(AccountOperationCommandType commandType,
                                                     UUID accountId,
                                                     UUID relatedAccountId,
                                                     BigDecimal amount,
                                                     CurrencyCode operationCurrency,
                                                     AuthenticatedUser user) {
        UUID commandId = UUID.randomUUID();
        LocalDateTime submittedAt = LocalDateTime.now();
        AccountOperationCommand command = new AccountOperationCommand(
                commandId,
                commandType,
                OperationCommandInitiator.from(user),
                accountId,
                relatedAccountId,
                amount,
                operationCurrency,
                submittedAt
        );
        operationProducer.send(command);
        return OperationAcceptedResponse.accepted(commandId, "Account operation accepted for asynchronous processing.", submittedAt);
    }

    private Account getAccountAndCheckAuthorization(UUID accountId, AuthenticatedUser user) {
        return resourceAccessService.getResourceAndCheckAuthorization(
                accountId,
                user,
                accountRepository,
                "Account",
                Account::getUserId
        );
    }

    private Account getVisibleAuthorizedAccount(UUID accountId, AuthenticatedUser user) {
        Account account = getAccountAndCheckAuthorization(accountId, user);
        ensureVisibleAccount(account);
        return account;
    }

    private Account getVisibleOpenAuthorizedAccount(UUID accountId, AuthenticatedUser user) {
        Account account = getVisibleAuthorizedAccount(accountId, user);
        ensureAccountOpen(account);
        return account;
    }

    private void ensureUserExists(UUID userId) {
        userAppClient.getUserById(userId);
    }

    private void ensureVisibleAccount(Account account) {
        if (account.getType() != AccountType.CUSTOMER) {
            throw new NotFoundException("Account not found with ID: " + account.getId());
        }
    }

    private void ensureAccountOpen(Account account) {
        if (account.getStatus() == AccountStatus.CLOSED) {
            throw new BadRequestException("Account is closed.");
        }
    }

    private String resolveAccountName(AccountCreateRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            return DEFAULT_ACCOUNT_NAME;
        }
        return request.name().trim();
    }

    private CurrencyCode resolveAccountCurrency(AccountCreateRequest request) {
        CurrencyCode currency = request == null || request.currency() == null
                ? bankProperties.getBaseCurrency()
                : request.currency();
        validateSupportedCurrency(currency);
        return currency;
    }

    private void validateSupportedCurrency(CurrencyCode currency) {
        if (!bankProperties.getSupportedCurrencies().contains(currency)) {
            throw new BadRequestException("Currency %s is not supported by the bank.".formatted(currency));
        }
    }

    private List<AccountStatus> resolveStatuses(List<AccountStatus> statuses) {
        if (statuses == null || statuses.isEmpty()) {
            return List.of(AccountStatus.OPEN);
        }
        return new ArrayList<>(statuses);
    }
}

