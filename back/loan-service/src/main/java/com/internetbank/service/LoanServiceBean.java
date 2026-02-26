package com.internetbank.service;

import com.internetbank.common.clients.AccountServiceClient;
import com.internetbank.common.clients.UserAppClient;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.exceptions.BadRequestException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.db.model.AccountLoan;
import com.internetbank.db.model.Loan;
import com.internetbank.db.model.Tariff;
import com.internetbank.db.model.enums.LoanStatus;
import com.internetbank.db.repository.AccountLoanRepository;
import com.internetbank.db.repository.LoanRepository;
import com.internetbank.db.repository.TariffRepository;
import com.internetbank.dto.request.CreateLoanRequest;
import com.internetbank.dto.response.LoanResponse;
import com.internetbank.mapper.LoanMapper;
import com.internetbank.service.strategy.PaymentStrategy;
import com.internetbank.service.strategy.PaymentStrategyFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanServiceBean implements LoanService {

    private final LoanRepository loanRepository;
    private final AccountLoanRepository accountLoanRepository;
    private final TariffRepository tariffRepository;
    private final AccountServiceClient accountServiceClient;
    private final UserAppClient userAppClient;
    private final LoanMapper loanMapper;
    private final PaymentStrategyFactory paymentStrategyFactory;

    @Override
    @Transactional
    public LoanResponse createLoan(CreateLoanRequest request) {
        log.info("Creating loan for account: {}", request.accountId());

        UserDTO userResponse = userAppClient.getUserById(request.userId());
        if (userResponse == null) {
            throw new NotFoundException("User not found: " + request.userId());
        }

        ResponseEntity<AccountDTO> accountResponse = accountServiceClient.getAccount(request.accountId(), userResponse.id());
        if (!accountResponse.getStatusCode().is2xxSuccessful() || accountResponse.getBody() == null) {
            throw new NotFoundException("Account not found: " + request.accountId());
        }

        log.info("0");

        AccountDTO account = accountResponse.getBody();
        if (!account.userId().equals(request.userId())) {
            throw new BadRequestException("Account does not belong to user");
        }

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

        log.info("1");

        Loan loan = Loan.builder()
                .amount(request.amount())
                .termMonths(request.termMonths())
                .tariffId(tariff.getId())
                .status(LoanStatus.PENDING)
                .build();

        loan = loanRepository.save(loan);

        log.info("2");

        PaymentStrategy strategy = paymentStrategyFactory.getStrategy(request.paymentType());
        BigDecimal monthlyPayment = strategy.calculateMonthlyPayment(
                request.amount(),
                tariff.getRate(),
                request.termMonths()
        );

        AccountLoan accountLoan = AccountLoan.builder()
                .accountId(request.accountId())
                .loanId(loan.getId())
                .status(LoanStatus.PENDING)
                .monthlyPayment(monthlyPayment)
                .remainingAmount(request.amount())
                .nextPaymentDate(LocalDate.now().plusMonths(1))
                .paymentType(request.paymentType())
                .paymentDate(LocalDate.now())
                .createdAt(LocalDate.now())
                .build();

        accountLoan = accountLoanRepository.save(accountLoan);

        log.info("Loan created successfully. Loan ID: {}, Account ID: {}", loan.getId(), request.accountId());

        return loanMapper.toLoanResponse(loan, accountLoan, tariff);
    }
}
