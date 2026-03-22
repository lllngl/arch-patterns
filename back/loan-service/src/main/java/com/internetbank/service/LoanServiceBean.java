package com.internetbank.service;

import com.internetbank.common.service.ExchangeRateService;
import com.internetbank.common.clients.AccountServiceClient;
import com.internetbank.common.clients.UserAppClient;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.dtos.MoneyOperationRequest;
import com.internetbank.common.dtos.OperationAcceptedResponse;
import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.dtos.page.PageRequestParams;
import com.internetbank.common.enums.RoleName;
import com.internetbank.common.exceptions.BadRequestException;
import com.internetbank.common.exceptions.ForbiddenException;
import com.internetbank.common.exceptions.InternalServerErrorException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.common.parameters.PageableUtils;
import com.internetbank.common.security.AuthenticatedUser;
import com.internetbank.common.security.ResourceAccessService;
import com.internetbank.db.model.Loan;
import com.internetbank.db.model.PaymentHistory;
import com.internetbank.db.model.Tariff;
import com.internetbank.db.model.enums.LoanStatus;
import com.internetbank.db.model.enums.PaymentStatus;
import com.internetbank.db.repository.LoanRepository;
import com.internetbank.db.repository.PaymentHistoryRepository;
import com.internetbank.db.repository.TariffRepository;
import com.internetbank.dto.request.CreateLoanRequest;
import com.internetbank.dto.request.RepayLoanRequest;
import com.internetbank.dto.response.CreditRatingResponse;
import com.internetbank.dto.response.LoanResponse;
import com.internetbank.dto.response.PaymentHistoryResponse;
import com.internetbank.mapper.LoanMapper;
import com.internetbank.mapper.PaymentHistoryMapper;
import com.internetbank.service.strategy.PaymentStrategy;
import com.internetbank.service.strategy.PaymentStrategyFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanServiceBean implements LoanService {

    private final LoanRepository loanRepository;
    private final TariffRepository tariffRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;
    private final CreditRatingService creditRatingService;
    private final ExchangeRateService rateService;
    private final AccountServiceClient accountServiceClient;
    private final UserAppClient userAppClient;
    private final LoanMapper loanMapper;
    private final PaymentHistoryMapper paymentHistoryMapper;
    private final PaymentStrategyFactory paymentStrategyFactory;
    private final ResourceAccessService resourceAccessService;
    private final PageableUtils pageableUtils;

    private static final List<PaymentStatus> OVERDUE_STATUSES = List.of(
            PaymentStatus.OVERDUE,
            PaymentStatus.LATE
    );

    @Override
    @Transactional
    public LoanResponse createLoan(CreateLoanRequest request) {
        log.info("Creating loan for account: {}", request.accountId());

        Pair<UserDTO, AccountDTO> userAccount = getUserAccount(request.userId(), request.accountId());

        if (!userAccount.getRight().userId().equals(userAccount.getLeft().id()))
            throw new BadRequestException("Account does not belong to user");

        Tariff tariff = tariffRepository.findById(request.tariffId())
                .orElseThrow(() -> new NotFoundException("Tariff not found: " + request.tariffId()));

        if (!tariff.isActive()) throw new BadRequestException("Tariff is not active");

        if (request.amount().compareTo(tariff.getMinAmount()) < 0)
            throw new BadRequestException("Amount is less than minimum: " + tariff.getMinAmount());

        if (request.amount().compareTo(tariff.getMaxAmount()) > 0)
            throw new BadRequestException("Amount exceeds maximum: " + tariff.getMaxAmount());

        if (request.termMonths() < tariff.getMinTermMonths() || request.termMonths() > tariff.getMaxTermMonths()) {
            throw new BadRequestException(String.format("Term must be between %d and %d months",
                    tariff.getMinTermMonths(), tariff.getMaxTermMonths()));
        }

        PaymentStrategy strategy = paymentStrategyFactory.getStrategy(request.paymentType());
        BigDecimal monthlyPayment = strategy.calculateMonthlyPayment(
                request.amount(),
                tariff.getRate(),
                request.termMonths()
        );

        Loan loan = Loan.builder()
                .userId(request.userId())
                .accountId(request.accountId())
                .status(LoanStatus.PENDING)
                .currencyCode(tariff.getCurrency())
                .paymentType(request.paymentType())
                .termMonths(request.termMonths())
                .tariffId(request.tariffId())
                .amount(request.amount())
                .monthlyPayment(monthlyPayment)
                .remainingAmount(monthlyPayment.multiply(BigDecimal.valueOf(request.termMonths())))
                .nextPaymentDate(null)
                .paymentDate(LocalDate.now())
                .createdAt(LocalDate.now())
                .build();

        loan = loanRepository.save(loan);

        log.info("Loan created successfully. Loan ID: {}, Account ID: {}", loan.getId(), request.accountId());

        return loanMapper.toLoanResponse(loan, tariff);
    }

    @Override
    @Transactional
    public LoanResponse repayLoan(UUID loanId, RepayLoanRequest request) {
        log.info("Repaying loan: {}", loanId);

        Pair<UserDTO, AccountDTO> userAccount = getUserAccount(request.userId(), request.accountId());

        UserDTO user = userAccount.getLeft();
        AccountDTO account = userAccount.getRight();
        if (!(account.userId().equals(user.id()))) throw new ForbiddenException("Account does not belong to user");

        Loan loan = getLoanAndCheckAuthorization(loanId, toAuthenticatedUser(user));
        BigDecimal amountInLoanCurrency = rateService.convert(
                request.amount(),
                request.currency(),
                loan.getCurrencyCode()
                ).convertedAmount();

        if (loan.getStatus() != LoanStatus.ACTIVE && loan.getStatus() != LoanStatus.OVERDUE)
            throw new BadRequestException("Loan is not active. Current status: " + loan.getStatus());
        if (loan.getMonthlyPayment().compareTo(amountInLoanCurrency) > 0) {
            throw new BadRequestException(
                    String.format("Amount is less than required monthly payment. Required: %s, Provided: %s",
                            loan.getMonthlyPayment(), amountInLoanCurrency)
            );
        }

        BigDecimal exchangeRate = rateService.getRate(request.currency(), loan.getCurrencyCode());

        PaymentHistory paymentHistory = PaymentHistory.builder()
                .loanId(loan.getId())
                .userId(loan.getUserId())
                .accountId(loan.getAccountId())
                .paymentAmount(request.amount())
                .paymentCurrency(request.currency())
                .loanCurrency(loan.getCurrencyCode())
                .exchangeRateAtPayment(exchangeRate)
                .expectedPaymentDate(loan.getNextPaymentDate() != null ? loan.getNextPaymentDate() : LocalDate.now())
                .actualPaymentDate(LocalDate.now())
                .status(PaymentStatus.PAID)
                .penaltyAmount(calculatePenalty(loan))
                .build();

        try {
            ResponseEntity<OperationAcceptedResponse> transactionResponse = accountServiceClient.withdraw(
                    request.accountId(), new MoneyOperationRequest(request.amount(), request.currency()), user.id());

            if (!transactionResponse.getStatusCode().is2xxSuccessful()) {
                if (loan.getNextPaymentDate().isBefore(LocalDate.now())) {
                    paymentHistory.setStatus(PaymentStatus.OVERDUE);
                } else {
                    paymentHistory.setStatus(PaymentStatus.SKIPPED);
                }
                paymentHistoryRepository.save(paymentHistory);
                throw new InternalServerErrorException("Failed to withdraw money from account");
            }

            if(loan.getNextPaymentDate().isBefore(LocalDate.now())) paymentHistory.setStatus(PaymentStatus.LATE);

            BigDecimal newRemaining = loan.getRemainingAmount().subtract(amountInLoanCurrency);
            if (newRemaining.compareTo(BigDecimal.ZERO) <= 0) {
                loan.setStatus(LoanStatus.PAID);
                loan.setRemainingAmount(BigDecimal.ZERO);
                loan.setNextPaymentDate(null);
                log.info("Loan fully repaid: {}", loanId);
            } else {
                loan.setStatus(LoanStatus.ACTIVE);
                loan.setRemainingAmount(newRemaining);
                loan.setNextPaymentDate(LocalDate.now().plusMonths(1));
            }

            loan.setPaymentDate(LocalDate.now());
            paymentHistory.setActualPaymentDate(LocalDate.now());

            loan = loanRepository.save(loan);
            paymentHistoryRepository.save(paymentHistory);

            Tariff tariff = tariffRepository.findById(loan.getTariffId())
                    .orElseThrow(() -> new NotFoundException("Tariff not found."));

            log.info("Loan repayment successful. Remaining amount: {}", loan.getRemainingAmount());

            return loanMapper.toLoanResponse(loan, tariff);

        } catch (Exception e) {
            if (loan.getNextPaymentDate().isBefore(LocalDate.now())) {
                paymentHistory.setStatus(PaymentStatus.OVERDUE);
            } else {
                paymentHistory.setStatus(PaymentStatus.SKIPPED);
            }
            paymentHistoryRepository.save(paymentHistory);
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public LoanResponse getLoan(UUID loanId, AuthenticatedUser user) {
        log.info("Getting loan: {}", loanId);

        Loan loan = getLoanAndCheckAuthorization(loanId, user);

        Tariff tariff = tariffRepository.findById(loan.getTariffId())
                .orElseThrow(() -> new NotFoundException("Tariff not found: " + loan.getTariffId()));

        return loanMapper.toLoanResponse(loan, tariff);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LoanResponse> getAllLoans(PageRequestParams pageParams, LoanStatus status) {
        log.info("Getting all loans with pagination: page={}, size={}, status={}",
                pageParams.page(), pageParams.size(), status);

        Pageable pageable = pageableUtils.of(pageParams);
        Page<Loan> loansPage;

        if (status != null) {
            loansPage = loanRepository.findByStatus(status, pageable);
        } else {
            loansPage = loanRepository.findAll(pageable);
        }

        return loansPage.map(loan -> {
            Tariff tariff = tariffRepository.findById(loan.getTariffId())
                    .orElseThrow(() -> new NotFoundException("Tariff not found: " + loan.getTariffId()));
            return loanMapper.toLoanResponse(loan, tariff);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LoanResponse> getLoansByUser(UUID userId, PageRequestParams pageParams, LoanStatus status) {
        log.info("Getting loans for user: {} with pagination: page={}, size={}, status={}",
                userId, pageParams.page(), pageParams.size(), status);

        Pageable pageable = pageableUtils.of(pageParams);
        Page<Loan> loansPage;

        if (status != null) {
            loansPage = loanRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            loansPage = loanRepository.findByUserId(userId, pageable);
        }

        return loansPage.map(loan -> {
            Tariff tariff = tariffRepository.findById(loan.getTariffId())
                    .orElseThrow(() -> new NotFoundException("Tariff not found: " + loan.getTariffId()));
            return loanMapper.toLoanResponse(loan, tariff);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LoanResponse> getMyLoans(UUID userId, PageRequestParams pageParams, LoanStatus status, AuthenticatedUser user) {
        if (!user.getId().equals(userId)) {
            throw new ForbiddenException("User can only access their own loans");
        }

        return getLoansByUser(userId, pageParams, status);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentHistoryResponse> getOverduePaymentsByUser(UUID userId, PageRequestParams pageParams, AuthenticatedUser user) {
        log.info("Getting overdue payments for user: {}", userId);

        if (!user.hasRole(RoleName.EMPLOYEE) && !user.getId().equals(userId)) {
            throw new ForbiddenException("User can only access their own overdue payments");
        }

        Pageable pageable = pageableUtils.of(pageParams);
        Page<PaymentHistory> payments = paymentHistoryRepository.findOverduePaymentsByUser(userId, OVERDUE_STATUSES, pageable);

        return payments.map(paymentHistoryMapper::toPaymentHistoryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentHistoryResponse> getOverduePaymentsByLoan(UUID loanId, PageRequestParams pageParams, AuthenticatedUser user) {
        log.info("Getting overdue payments for loan: {}", loanId);

        Loan loan = getLoanAndCheckAuthorization(loanId, user);
        Pageable pageable = pageableUtils.of(pageParams);

        Page<PaymentHistory> overduePayments = paymentHistoryRepository.findOverduePaymentsByLoan(loanId, OVERDUE_STATUSES, pageable);

        return overduePayments.map(paymentHistoryMapper::toPaymentHistoryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CreditRatingResponse getCreditRating(UUID userId, AuthenticatedUser user) {
        log.info("Getting credit rating for user: {}", userId);

        if (!user.hasRole(RoleName.EMPLOYEE) && !user.getId().equals(userId)) {
            throw new ForbiddenException("User can only view their own credit rating");
        }

        UserDTO userDTO = userAppClient.getUserById(userId);
        if (userDTO == null) throw new NotFoundException("User not found: " + userId);

        return creditRatingService.calculateCreditRating(userId);
    }

    @Override
    @Transactional
    public void rejectLoan(UUID loanId) {
        log.info("Rejecting loan: {}", loanId);

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new NotFoundException("Loan not found: " + loanId));

        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new BadRequestException("Only pending loans can be rejected. Current status: " + loan.getStatus());
        }

        loan.setStatus(LoanStatus.REJECTED);
        loanRepository.save(loan);

        log.info("Loan rejected successfully: {}", loanId);
    }

    @Override
    @Transactional
    public void approveLoan(UUID loanId) {
        log.info("Approving loan: {}", loanId);

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new NotFoundException("Loan not found: " + loanId));

        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new BadRequestException("Only pending loans can be approved. Current status: " + loan.getStatus());
        }

        UserDTO user = userAppClient.getUserById(loan.getUserId());
        accountServiceClient.deposit(loan.getAccountId(), new MoneyOperationRequest(loan.getAmount(), loan.getCurrencyCode()), user.id());

        loan.setStatus(LoanStatus.ACTIVE);
        loan.setNextPaymentDate(LocalDate.now().plusMonths(1));
        loan.setPaymentDate(LocalDate.now());
        loanRepository.save(loan);

        log.info("Loan approved successfully: {}", loanId);
    }


    private Pair<UserDTO, AccountDTO> getUserAccount(UUID userId, UUID accountId) {
        UserDTO userResponse = userAppClient.getUserById(userId);
        if (userResponse == null) {
            throw new NotFoundException("User not found: " + userId);
        }

        ResponseEntity<AccountDTO> accountResponse = accountServiceClient.getAccount(accountId, userResponse.id());
        if (!accountResponse.getStatusCode().is2xxSuccessful() || accountResponse.getBody() == null) {
            throw new NotFoundException("Account not found: " + accountId);
        }

        return Pair.of(userResponse, accountResponse.getBody());
    }

    private Loan getLoanAndCheckAuthorization(UUID loanId, AuthenticatedUser user) {
        return resourceAccessService.getResourceAndCheckAuthorization(
                loanId,
                user,
                loanRepository,
                "Loan",
                Loan::getUserId
        );
    }

    private AuthenticatedUser toAuthenticatedUser(UserDTO user) {
        return AuthenticatedUser.external(user.id(), user.keycloakUserId(), user.email(), user.roles());
    }

    private BigDecimal calculatePenalty(Loan loan) {
        if (loan.getNextPaymentDate() != null && loan.getNextPaymentDate().isBefore(LocalDate.now())) {
            long daysOverdue = ChronoUnit.DAYS.between(loan.getNextPaymentDate(), LocalDate.now());
            BigDecimal penaltyRate = BigDecimal.valueOf(0.0005); // 0.05% в день

            return loan.getMonthlyPayment().multiply(penaltyRate).multiply(BigDecimal.valueOf(daysOverdue));
        }
        return BigDecimal.ZERO;
    }
}
