package com.internetbank.account_service.services;

import com.internetbank.account_service.configs.BankProperties;
import com.internetbank.account_service.dtos.MoneyOperationRequest;
import com.internetbank.account_service.dtos.TransferRequest;
import com.internetbank.account_service.enums.AccountStatus;
import com.internetbank.account_service.enums.AccountType;
import com.internetbank.account_service.enums.TransactionType;
import com.internetbank.account_service.messaging.AccountOperationCommand;
import com.internetbank.account_service.messaging.AccountTransactionsInvalidationEvent;
import com.internetbank.account_service.models.Account;
import com.internetbank.account_service.models.AccountTransaction;
import com.internetbank.account_service.repositories.AccountRepository;
import com.internetbank.account_service.repositories.AccountTransactionRepository;
import com.internetbank.common.enums.CurrencyCode;
import com.internetbank.common.exceptions.BadRequestException;
import com.internetbank.common.exceptions.ForbiddenException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.common.security.AuthenticatedUser;
import com.internetbank.common.security.ResourceAccessService;
import com.internetbank.common.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountOperationProcessingService {

    private final AccountRepository accountRepository;
    private final AccountTransactionRepository accountTransactionRepository;
    private final ResourceAccessService resourceAccessService;
    private final ExchangeRateService exchangeRateService;
    private final BankProperties bankProperties;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Transactional(readOnly = true)
    public void validateDeposit(UUID accountId, MoneyOperationRequest request, AuthenticatedUser user) {
        Account account = getVisibleOpenAuthorizedAccount(accountId, user);
        buildAccountOperation(account, request.amount(), request.operationCurrency());
    }

    @Transactional(readOnly = true)
    public void validateWithdraw(UUID accountId, MoneyOperationRequest request, AuthenticatedUser user) {
        Account account = getVisibleOpenAuthorizedAccount(accountId, user);
        AccountOperation accountOperation = buildAccountOperation(account, request.amount(), request.operationCurrency());
        validateAmountAgainstBalance(account, accountOperation.totalDebitAmount());
    }

    @Transactional(readOnly = true)
    public void validateTransfer(TransferRequest request, AuthenticatedUser user) {
        if (request.fromAccountId().equals(request.toAccountId())) {
            throw new BadRequestException("Transfer between the same account is not allowed.");
        }

        Account sourceAccount = getVisibleOpenAuthorizedAccount(request.fromAccountId(), user);
        Account targetAccount = getVisibleOpenAccount(request.toAccountId());
        TransferAmounts transferAmounts = buildTransferAmounts(
                sourceAccount,
                targetAccount,
                request.amount(),
                request.operationCurrency()
        );
        validateAmountAgainstBalance(sourceAccount, transferAmounts.totalDebitAmount());
    }

    @Transactional
    public void processCommand(AccountOperationCommand command) {
        AuthenticatedUser user = command.initiator().toAuthenticatedUser();
        Set<UUID> affectedAccountIds = switch (command.type()) {
            case DEPOSIT -> processDeposit(command.accountId(), command.amount(), command.operationCurrency(), user);
            case WITHDRAW -> processWithdraw(command.accountId(), command.amount(), command.operationCurrency(), user);
            case TRANSFER -> processTransfer(command.accountId(), command.relatedAccountId(), command.amount(), command.operationCurrency(), user);
        };

        applicationEventPublisher.publishEvent(new AccountTransactionsInvalidationEvent(
                command.commandId(),
                command.type(),
                command.initiator().userId(),
                affectedAccountIds,
                LocalDateTime.now()
        ));
    }

    private Set<UUID> processDeposit(UUID accountId,
                                     BigDecimal amount,
                                     CurrencyCode operationCurrency,
                                     AuthenticatedUser user) {
        Account account = getVisibleOpenAuthorizedAccount(accountId, user);
        AccountOperation accountOperation = buildAccountOperation(account, amount, operationCurrency);
        BigDecimal netCreditAmount = validateAndGetNetDepositAmount(accountOperation);

        account = applyBalanceChange(account, netCreditAmount);

        saveTransaction(
                account.getId(),
                netCreditAmount,
                amount,
                TransactionType.INCOME,
                accountOperation.fxOperation() ? "FX account deposit" : "Account deposit",
                accountOperation.operationCurrency(),
                account.getCurrency(),
                bankProperties.getBaseCurrency(),
                accountOperation.accountConversion().rate(),
                accountOperation.commissionAmount(),
                account.getCurrency(),
                null
        );

        if (accountOperation.fxOperation()) {
            recordMasterTransaction(
                    TransactionType.MASTER_IN,
                    "Received converted deposit for account %s".formatted(account.getId()),
                    amount,
                    accountOperation.operationCurrency(),
                    account.getId()
            );
        }

        return Set.of(account.getId());
    }

    private Set<UUID> processWithdraw(UUID accountId,
                                      BigDecimal amount,
                                      CurrencyCode operationCurrency,
                                      AuthenticatedUser user) {
        Account account = getVisibleOpenAuthorizedAccount(accountId, user);
        AccountOperation accountOperation = buildAccountOperation(account, amount, operationCurrency);
        BigDecimal totalDebitAmount = accountOperation.totalDebitAmount();

        validateAmountAgainstBalance(account, totalDebitAmount);

        account = applyBalanceChange(account, totalDebitAmount.negate());

        saveTransaction(
                account.getId(),
                totalDebitAmount,
                amount,
                TransactionType.EXPENSE,
                accountOperation.fxOperation() ? "FX account withdraw" : "Account withdraw",
                accountOperation.operationCurrency(),
                account.getCurrency(),
                bankProperties.getBaseCurrency(),
                accountOperation.accountConversion().rate(),
                accountOperation.commissionAmount(),
                account.getCurrency(),
                null
        );

        if (accountOperation.fxOperation()) {
            recordMasterTransaction(
                    TransactionType.MASTER_OUT,
                    "Issued converted withdraw for account %s".formatted(account.getId()),
                    amount,
                    accountOperation.operationCurrency(),
                    account.getId()
            );
        }

        return Set.of(account.getId());
    }

    private Set<UUID> processTransfer(UUID sourceAccountId,
                                      UUID targetAccountId,
                                      BigDecimal amount,
                                      CurrencyCode operationCurrency,
                                      AuthenticatedUser user) {
        if (sourceAccountId.equals(targetAccountId)) {
            throw new BadRequestException("Transfer between the same account is not allowed.");
        }

        CurrencyCode bankCurrency = bankProperties.getBaseCurrency();
        Account sourcePreview = getVisibleOpenAuthorizedAccount(sourceAccountId, user);
        Account targetPreview = getVisibleOpenAccount(targetAccountId);
        TransferAmounts previewAmounts = buildTransferAmounts(sourcePreview, targetPreview, amount, operationCurrency);
        validateAmountAgainstBalance(sourcePreview, previewAmounts.totalDebitAmount());

        List<UUID> accountIdsToLock = new ArrayList<>(List.of(sourceAccountId, targetAccountId));
        UUID masterAccountId = null;
        if (previewAmounts.fxOperation()) {
            masterAccountId = getMasterAccount().getId();
            accountIdsToLock.add(masterAccountId);
        }

        Map<UUID, Account> lockedAccounts = lockAccounts(accountIdsToLock);
        Account sourceAccount = lockedAccounts.get(sourceAccountId);
        Account targetAccount = lockedAccounts.get(targetAccountId);

        ensureVisibleOpenAccount(sourceAccount);
        ensureVisibleOpenAccount(targetAccount);
        ensureAccountOwner(sourceAccount, user);

        TransferAmounts transferAmounts = buildTransferAmounts(sourceAccount, targetAccount, amount, operationCurrency);
        validateAmountAgainstBalance(sourceAccount, transferAmounts.totalDebitAmount());

        BigDecimal creditedAmount = transferAmounts.creditedAmount();

        sourceAccount = applyBalanceChange(sourceAccount, transferAmounts.totalDebitAmount().negate());
        targetAccount = applyBalanceChange(targetAccount, creditedAmount);

        if (!transferAmounts.fxOperation()) {
            saveTransaction(
                    sourceAccount.getId(),
                    transferAmounts.totalDebitAmount(),
                    amount,
                    TransactionType.TRANSFER_OUT,
                    "Transfer to account %s".formatted(targetAccount.getId()),
                    transferAmounts.operationCurrency(),
                    sourceAccount.getCurrency(),
                    bankCurrency,
                    transferAmounts.sourceConversion().rate(),
                    transferAmounts.commissionAmount(),
                    sourceAccount.getCurrency(),
                    targetAccount.getId()
            );
            saveTransaction(
                    targetAccount.getId(),
                    creditedAmount,
                    amount,
                    TransactionType.TRANSFER_IN,
                    "Transfer from account %s".formatted(sourceAccount.getId()),
                    transferAmounts.operationCurrency(),
                    targetAccount.getCurrency(),
                    bankCurrency,
                    transferAmounts.targetConversion().rate(),
                    BigDecimal.ZERO,
                    targetAccount.getCurrency(),
                    sourceAccount.getId()
            );
        } else {
            Account masterAccount = lockedAccounts.get(masterAccountId);
            ensureAccountOpen(masterAccount);

            saveTransaction(
                    sourceAccount.getId(),
                    transferAmounts.totalDebitAmount(),
                    amount,
                    TransactionType.TRANSFER_OUT,
                    "FX transfer to account %s".formatted(targetAccount.getId()),
                    transferAmounts.operationCurrency(),
                    sourceAccount.getCurrency(),
                    bankCurrency,
                    transferAmounts.sourceConversion().rate(),
                    transferAmounts.commissionAmount(),
                    sourceAccount.getCurrency(),
                    targetAccount.getId()
            );
            saveMasterTransaction(
                    masterAccount,
                    TransactionType.MASTER_IN,
                    "Received funds from account %s".formatted(sourceAccount.getId()),
                    amount,
                    transferAmounts,
                    sourceAccount.getId()
            );
            saveMasterTransaction(
                    masterAccount,
                    TransactionType.MASTER_OUT,
                    "Sent converted funds to account %s".formatted(targetAccount.getId()),
                    amount,
                    transferAmounts,
                    targetAccount.getId()
            );
            saveTransaction(
                    targetAccount.getId(),
                    creditedAmount,
                    amount,
                    TransactionType.TRANSFER_IN,
                    "FX transfer from account %s".formatted(sourceAccount.getId()),
                    transferAmounts.operationCurrency(),
                    targetAccount.getCurrency(),
                    bankCurrency,
                    transferAmounts.targetConversion().rate(),
                    BigDecimal.ZERO,
                    targetAccount.getCurrency(),
                    sourceAccount.getId()
            );
        }

        return new LinkedHashSet<>(List.of(sourceAccount.getId(), targetAccount.getId()));
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

    private Account getExistingAccount(UUID accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new NotFoundException("Account not found with ID: " + accountId));
    }

    private Account getVisibleOpenAccount(UUID accountId) {
        Account account = getExistingAccount(accountId);
        ensureVisibleOpenAccount(account);
        return account;
    }

    private Map<UUID, Account> lockAccounts(Collection<UUID> accountIds) {
        Map<UUID, Account> lockedAccounts = new HashMap<>();
        accountIds.stream()
                .distinct()
                .sorted(Comparator.comparing(UUID::toString))
                .forEach(accountId -> lockedAccounts.put(accountId, accountRepository.findByIdForUpdate(accountId)
                        .orElseThrow(() -> new NotFoundException("Account not found with ID: " + accountId))));
        return lockedAccounts;
    }

    private Account getMasterAccount() {
        return accountRepository.findByType(AccountType.MASTER)
                .orElseThrow(() -> new NotFoundException("Bank master account was not found."));
    }

    private void ensureAccountOwner(Account account, AuthenticatedUser user) {
        if (user == null || user.getId() == null) {
            throw new ForbiddenException("Invalid user information detected. Please contact support.");
        }
        if (!account.getUserId().equals(user.getId()) && !user.hasRole(com.internetbank.common.enums.RoleName.EMPLOYEE)) {
            throw new ForbiddenException("You are not authorized to transfer money from this account.");
        }
    }

    private void ensureVisibleAccount(Account account) {
        if (account.getType() != AccountType.CUSTOMER) {
            throw new NotFoundException("Account not found with ID: " + account.getId());
        }
    }

    private void ensureVisibleOpenAccount(Account account) {
        ensureVisibleAccount(account);
        ensureAccountOpen(account);
    }

    private void ensureAccountOpen(Account account) {
        if (account.getStatus() == AccountStatus.CLOSED) {
            throw new BadRequestException("Account is closed.");
        }
    }

    private void validateAmountAgainstBalance(Account account, BigDecimal amount) {
        if (account.getBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient funds.");
        }
    }

    private Account applyBalanceChange(Account account, BigDecimal delta) {
        account.setBalance(account.getBalance().add(delta));
        return accountRepository.saveAndFlush(account);
    }

    private void saveTransaction(UUID accountId,
                                 BigDecimal amount,
                                 BigDecimal operationAmount,
                                 TransactionType type,
                                 String description,
                                 CurrencyCode operationCurrency,
                                 CurrencyCode accountCurrency,
                                 CurrencyCode bankCurrency,
                                 BigDecimal exchangeRate,
                                 BigDecimal commissionAmount,
                                 CurrencyCode commissionCurrency,
                                 UUID relatedAccountId) {
        AccountTransaction transaction = AccountTransaction.builder()
                .accountId(accountId)
                .amount(amount)
                .operationAmount(operationAmount)
                .type(type)
                .description(description)
                .operationCurrency(operationCurrency)
                .accountCurrency(accountCurrency)
                .bankCurrency(bankCurrency)
                .exchangeRate(exchangeRate)
                .commissionAmount(commissionAmount)
                .commissionCurrency(commissionCurrency)
                .relatedAccountId(relatedAccountId)
                .build();
        accountTransactionRepository.save(transaction);
    }

    private AccountOperation buildAccountOperation(Account account, BigDecimal operationAmount, CurrencyCode requestedOperationCurrency) {
        CurrencyCode operationCurrency = resolveOperationCurrency(requestedOperationCurrency, account.getCurrency());
        ConversionDetails accountConversion = convertAmount(operationAmount, operationCurrency, account.getCurrency());
        boolean fxOperation = isFxOperation(operationCurrency, account.getCurrency());
        BigDecimal commissionAmount = calculateCommission(accountConversion.convertedAmount(), fxOperation);
        return new AccountOperation(operationCurrency, accountConversion, fxOperation, commissionAmount);
    }

    private TransferAmounts buildTransferAmounts(Account sourceAccount,
                                                 Account targetAccount,
                                                 BigDecimal operationAmount,
                                                 CurrencyCode requestedOperationCurrency) {
        CurrencyCode operationCurrency = resolveOperationCurrency(requestedOperationCurrency, sourceAccount.getCurrency());
        ConversionDetails sourceConversion = convertAmount(operationAmount, operationCurrency, sourceAccount.getCurrency());
        ConversionDetails targetConversion = convertAmount(operationAmount, operationCurrency, targetAccount.getCurrency());
        ConversionDetails bankConversion = convertAmount(operationAmount, operationCurrency, bankProperties.getBaseCurrency());
        boolean fxOperation = isFxOperation(operationCurrency, sourceAccount.getCurrency(), targetAccount.getCurrency());
        BigDecimal commissionAmount = calculateCommission(sourceConversion.convertedAmount(), fxOperation);
        BigDecimal totalDebitAmount = sourceConversion.convertedAmount().add(commissionAmount);

        return new TransferAmounts(
                operationCurrency,
                sourceConversion,
                targetConversion,
                bankConversion,
                fxOperation,
                commissionAmount,
                totalDebitAmount,
                targetConversion.convertedAmount()
        );
    }

    private BigDecimal validateAndGetNetDepositAmount(AccountOperation accountOperation) {
        BigDecimal netCreditAmount = accountOperation.accountConversion().convertedAmount().subtract(accountOperation.commissionAmount());
        if (netCreditAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Deposit amount is too small after commission.");
        }
        return netCreditAmount;
    }

    private void recordMasterTransaction(TransactionType type,
                                         String description,
                                         BigDecimal operationAmount,
                                         CurrencyCode operationCurrency,
                                         UUID relatedAccountId) {
        Account masterAccount = getMasterAccount();
        ConversionDetails bankConversion = convertAmount(operationAmount, operationCurrency, bankProperties.getBaseCurrency());
        saveMasterTransaction(masterAccount, type, description, operationAmount, operationCurrency, bankConversion, relatedAccountId);
    }

    private void saveMasterTransaction(Account masterAccount,
                                       TransactionType type,
                                       String description,
                                       BigDecimal operationAmount,
                                       TransferAmounts transferAmounts,
                                       UUID relatedAccountId) {
        saveMasterTransaction(
                masterAccount,
                type,
                description,
                operationAmount,
                transferAmounts.operationCurrency(),
                transferAmounts.bankConversion(),
                relatedAccountId
        );
    }

    private void saveMasterTransaction(Account masterAccount,
                                       TransactionType type,
                                       String description,
                                       BigDecimal operationAmount,
                                       CurrencyCode operationCurrency,
                                       ConversionDetails bankConversion,
                                       UUID relatedAccountId) {
        saveTransaction(
                masterAccount.getId(),
                bankConversion.convertedAmount(),
                operationAmount,
                type,
                description,
                operationCurrency,
                bankProperties.getBaseCurrency(),
                bankProperties.getBaseCurrency(),
                bankConversion.rate(),
                BigDecimal.ZERO,
                bankProperties.getBaseCurrency(),
                relatedAccountId
        );
    }

    private CurrencyCode resolveOperationCurrency(CurrencyCode requestedCurrency, CurrencyCode defaultCurrency) {
        CurrencyCode currency = requestedCurrency == null ? defaultCurrency : requestedCurrency;
        validateSupportedCurrency(currency);
        return currency;
    }

    private void validateSupportedCurrency(CurrencyCode currency) {
        if (!bankProperties.getSupportedCurrencies().contains(currency)) {
            throw new BadRequestException("Currency %s is not supported by the bank.".formatted(currency));
        }
    }

    private ConversionDetails convertAmount(BigDecimal amount, CurrencyCode fromCurrency, CurrencyCode toCurrency) {
        if (fromCurrency == toCurrency) {
            return new ConversionDetails(amount, BigDecimal.ONE);
        }

        ExchangeRateService.ConversionResult conversion = exchangeRateService.convert(amount, fromCurrency, toCurrency);
        return new ConversionDetails(conversion.convertedAmount(), conversion.rate());
    }

    private BigDecimal calculateCommission(BigDecimal baseAmount, boolean shouldChargeCommission) {
        if (!shouldChargeCommission || bankProperties.getCommissionPercent() == null || bankProperties.getCommissionPercent().signum() <= 0) {
            return BigDecimal.ZERO;
        }

        return baseAmount
                .multiply(bankProperties.getCommissionPercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private boolean isFxOperation(CurrencyCode operationCurrency, CurrencyCode... accountCurrencies) {
        for (CurrencyCode accountCurrency : accountCurrencies) {
            if (operationCurrency != accountCurrency) {
                return true;
            }
        }
        return false;
    }

    private record ConversionDetails(BigDecimal convertedAmount, BigDecimal rate) {
    }

    private record AccountOperation(
            CurrencyCode operationCurrency,
            ConversionDetails accountConversion,
            boolean fxOperation,
            BigDecimal commissionAmount
    ) {
        private BigDecimal totalDebitAmount() {
            return accountConversion.convertedAmount().add(commissionAmount);
        }
    }

    private record TransferAmounts(
            CurrencyCode operationCurrency,
            ConversionDetails sourceConversion,
            ConversionDetails targetConversion,
            ConversionDetails bankConversion,
            boolean fxOperation,
            BigDecimal commissionAmount,
            BigDecimal totalDebitAmount,
            BigDecimal creditedAmount
    ) {
    }
}
