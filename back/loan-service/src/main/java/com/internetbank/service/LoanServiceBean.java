package com.internetbank.service;

import com.internetbank.common.clients.AccountServiceClient;
import com.internetbank.common.clients.UserAppClient;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.dtos.MoneyOperationRequest;
import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.dtos.page.PageRequestParams;
import com.internetbank.common.exceptions.BadRequestException;
import com.internetbank.common.exceptions.ForbiddenException;
import com.internetbank.common.exceptions.InternalServerErrorException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.common.parameters.PageableUtils;
import com.internetbank.common.security.ResourceAccessService;
import com.internetbank.db.model.Loan;
import com.internetbank.db.model.Tariff;
import com.internetbank.db.model.enums.LoanStatus;
import com.internetbank.db.repository.LoanRepository;
import com.internetbank.db.repository.TariffRepository;
import com.internetbank.dto.request.CreateLoanRequest;
import com.internetbank.dto.request.RepayLoanRequest;
import com.internetbank.dto.response.LoanResponse;
import com.internetbank.mapper.LoanMapper;
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
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanServiceBean implements LoanService {

    private final LoanRepository loanRepository;
    private final TariffRepository tariffRepository;
    private final AccountServiceClient accountServiceClient;
    private final UserAppClient userAppClient;
    private final LoanMapper loanMapper;
    private final PaymentStrategyFactory paymentStrategyFactory;
    private final ResourceAccessService resourceAccessService;
    private final PageableUtils pageableUtils;

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
                .paymentType(request.paymentType())
                .termMonths(request.termMonths())
                .tariffId(request.tariffId())
                .amount(request.amount())
                .monthlyPayment(monthlyPayment)
                .remainingAmount(request.amount())
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

        Loan loan = getLoanAndCheckAuthorization(loanId, user);

        if (loan.getStatus() != LoanStatus.ACTIVE) throw new BadRequestException("Loan is not active. Current status: " + loan.getStatus());
        if (loan.getMonthlyPayment().compareTo(request.amount()) > 0
                && loan.getRemainingAmount().compareTo(request.amount()) > 0) {
            throw new BadRequestException("Amount is too small. Your monthly payment: " + loan.getMonthlyPayment());
        }

        if (!(account.userId().equals(user.id()))) throw new ForbiddenException("Account does not belong to user");
        if (account.balance().compareTo(request.amount()) < 0) throw new BadRequestException("Insufficient funds on account");

        ResponseEntity<AccountDTO> transactionResponse = accountServiceClient.withdraw(
                request.accountId(), new MoneyOperationRequest(request.amount()), user.id());

        if (!transactionResponse.getStatusCode().is2xxSuccessful()) throw new InternalServerErrorException("Failed to debit amount from account");

        BigDecimal newRemaining = loan.getRemainingAmount().subtract(request.amount());

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

        loan = loanRepository.save(loan);

        Tariff tariff = tariffRepository.findById(loan.getTariffId())
                .orElseThrow(() -> new NotFoundException("Tariff not found."));

        log.info("Loan repayment successful. Remaining amount: {}", loan.getRemainingAmount());

        return loanMapper.toLoanResponse(loan, tariff);
    }

    @Override
    @Transactional(readOnly = true)
    public LoanResponse getLoan(UUID loanId, UserDTO user) {
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
    public Page<LoanResponse> getMyLoans(UUID userId, PageRequestParams pageParams, LoanStatus status, UserDTO user) {
        if (!user.id().equals(userId)) {
            throw new ForbiddenException("User can only access their own loans");
        }

        return getLoansByUser(userId, pageParams, status);
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
        accountServiceClient.deposit(loan.getAccountId(), new MoneyOperationRequest(loan.getAmount()), user.id());

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

    private Loan getLoanAndCheckAuthorization(UUID loanId, UserDTO user) {
        return resourceAccessService.getResourceAndCheckAuthorization(
                loanId,
                user,
                loanRepository,
                "Loan",
                Loan::getUserId
        );
    }
}
