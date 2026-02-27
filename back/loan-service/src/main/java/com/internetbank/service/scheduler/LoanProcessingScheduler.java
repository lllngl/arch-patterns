package com.internetbank.service.scheduler;

import com.internetbank.common.clients.AccountServiceClient;
import com.internetbank.common.clients.UserAppClient;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.dtos.MoneyOperationRequest;
import com.internetbank.common.dtos.UserDTO;
import com.internetbank.db.model.Loan;
import com.internetbank.db.model.Tariff;
import com.internetbank.db.model.enums.LoanStatus;
import com.internetbank.db.repository.LoanRepository;
import com.internetbank.db.repository.TariffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class LoanProcessingScheduler {

    private final LoanRepository loanRepository;
    private final TariffRepository tariffRepository;
    private final AccountServiceClient accountServiceClient;
    private final UserAppClient userAppClient;

    /**
     * Запускается каждый день в 00:05
     * Обрабатывает кредиты, у которых наступила дата платежа или есть просрочка
     */
    @Scheduled(cron = "${scheduler.payment.cron:0 5 0 * * *}")
    @Transactional
    public void processDuePayments() {
        log.info("Starting scheduled payment processing at {}", LocalDateTime.now());

        List<Loan> dueLoans = loanRepository.findDuePayments(LocalDate.now());

        log.info("Found {} loans with due payments", dueLoans.size());

        int processed = 0;
        int succeeded = 0;
        int failed = 0;

        for (Loan loan : dueLoans) {
            try {
                boolean result = processMonthlyPayment(loan);
                if (result) {
                    succeeded++;
                } else {
                    failed++;
                    markAsOverdue(loan);
                }
                processed++;
            } catch (Exception e) {
                log.error("Unexpected error processing loan: {}", loan.getId(), e);
                markAsOverdue(loan);
                failed++;
            }

            if (processed % 10 == 0) {
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }

        log.info("Payment processing completed. Processed: {}, Succeeded: {}, Failed: {}", processed, succeeded, failed);
    }

    /**
     * Запускается каждый день в 10:00 и 15:00
     * Проверяет кредиты со статусом PENDING и принимает решение о выдаче
     */
    @Scheduled(cron = "${scheduler.pending.cron:0 0 10,15 * * *}")
    @Transactional
    public void processPendingLoans() {
        log.info("Starting pending loans processing at {}", LocalDateTime.now());

        List<Loan> pendingLoans = loanRepository.findByStatusWithLimit(LoanStatus.PENDING);

        log.info("Found {} pending loans to process", pendingLoans.size());

        int approved = 0;
        int rejected = 0;
        int failed = 0;

        for (Loan loan : pendingLoans) {
            try {
                boolean shouldApprove = evaluateLoanApplication(loan);

                if (shouldApprove) {
                    approveLoan(loan);
                    approved++;
                    log.info("Loan {} approved automatically", loan.getId());
                } else {
                    rejectLoan(loan);
                    rejected++;
                    log.info("Loan {} rejected automatically", loan.getId());
                }
            } catch (Exception e) {
                log.error("Error processing pending loan: {}", loan.getId(), e);
                failed++;
            }
        }

        log.info("Pending loans processing completed. Approved: {}, Rejected: {}, Failed: {}",
                approved, rejected, failed);
    }

    private boolean processMonthlyPayment(Loan loan) {
        log.debug("Processing payment for loan: {}", loan.getId());

        try {
            ResponseEntity<AccountDTO> accountResponse = accountServiceClient.getAccount(
                    loan.getAccountId(),
                    loan.getUserId()
            );

            if (!accountResponse.getStatusCode().is2xxSuccessful() || accountResponse.getBody() == null) {
                log.error("Failed to get account info for loan: {}", loan.getId());
                return false;
            }

            AccountDTO account = accountResponse.getBody();
            UserDTO user = userAppClient.getUserById(loan.getUserId());
            if (user == null) {
                log.error("Failed to get user info for loan: {}", loan.getId());
                return false;
            }

            if (account.balance().compareTo(loan.getMonthlyPayment()) < 0) {
                log.warn("Insufficient funds for loan: {}. Balance: {}, Required: {}",
                        loan.getId(), account.balance(), loan.getMonthlyPayment());
                return false;
            }

            ResponseEntity<AccountDTO> transactionResponse = accountServiceClient.withdraw(
                    loan.getAccountId(),
                    new MoneyOperationRequest(loan.getMonthlyPayment()),
                    user.id()
            );

            if (!transactionResponse.getStatusCode().is2xxSuccessful()) {
                log.error("Failed to withdraw money for loan: {}", loan.getId());
                return false;
            }

            BigDecimal newRemaining = loan.getRemainingAmount().subtract(loan.getMonthlyPayment());
            loan.setRemainingAmount(newRemaining);
            loan.setPaymentDate(LocalDate.now());

            if (newRemaining.compareTo(BigDecimal.ZERO) <= 0) {
                loan.setStatus(LoanStatus.PAID);
                loan.setNextPaymentDate(null);
                log.info("Loan fully repaid via auto-payment: {}", loan.getId());
            } else {
                loan.setStatus(LoanStatus.ACTIVE);
                loan.setNextPaymentDate(LocalDate.now().plusMonths(1));
            }

            loanRepository.save(loan);
            log.debug("Payment successful for loan: {}. Remaining: {}", loan.getId(), newRemaining);

            return true;

        } catch (Exception e) {
            log.error("Error processing payment for loan: {}", loan.getId(), e);
            return false;
        }
    }

    private void markAsOverdue(Loan loan) {
        if (loan.getStatus() == LoanStatus.ACTIVE) {
            loan.setStatus(LoanStatus.OVERDUE);
            loanRepository.save(loan);
            log.warn("Loan marked as overdue: {}", loan.getId());
        }
    }

    private boolean evaluateLoanApplication(Loan loan) {
        log.debug("Evaluating loan application: {}", loan.getId());

        try {
            ResponseEntity<AccountDTO> accountResponse = accountServiceClient.getAccount(
                    loan.getAccountId(),
                    loan.getUserId()
            );

            if (!accountResponse.getStatusCode().is2xxSuccessful() || accountResponse.getBody() == null) {
                log.warn("Cannot evaluate loan {} - account not accessible", loan.getId());
                return false;
            }

            AccountDTO account = accountResponse.getBody();

            Tariff tariff = tariffRepository.findById(loan.getTariffId())
                    .orElseThrow(() -> new RuntimeException("Tariff not found: " + loan.getTariffId()));

            if (account.balance().compareTo(loan.getMonthlyPayment().multiply(new BigDecimal("3"))) < 0) {
                log.debug("Loan {} rejected: insufficient balance for 3 monthly payments", loan.getId());
                return false;
            }

            if (tariff.getRate().compareTo(new BigDecimal("0.25")) > 0) {
                if (account.balance().compareTo(loan.getAmount().multiply(new BigDecimal("0.3"))) < 0) {
                    return false;
                }
            }

            List<Loan> overdueLoans = loanRepository.findByUserIdAndStatus(loan.getUserId(), LoanStatus.OVERDUE);

            if (!overdueLoans.isEmpty()) {
                log.debug("Loan {} rejected: user has overdue loans", loan.getId());
                return false;
            }

            log.debug("Loan {} approved by scoring system", loan.getId());
            return true;

        } catch (Exception e) {
            log.error("Error evaluating loan: {}", loan.getId(), e);
            return false;
        }
    }

    private void approveLoan(Loan loan) {
        try {
            UserDTO user = userAppClient.getUserById(loan.getUserId());
            if (user == null) {
                log.error("Failed to get user info for loan: {}", loan.getId());
                return;
            }

            ResponseEntity<AccountDTO> depositResponse = accountServiceClient.deposit(
                    loan.getAccountId(),
                    new MoneyOperationRequest(loan.getAmount()),
                    user.id()
            );

            if (!depositResponse.getStatusCode().is2xxSuccessful()) {
                log.error("Failed to deposit money for approved loan: {}", loan.getId());
                loan.setStatus(LoanStatus.PENDING);
            } else {
                loan.setStatus(LoanStatus.ACTIVE);
                loan.setNextPaymentDate(LocalDate.now().plusMonths(1));
                loan.setPaymentDate(LocalDate.now());
                log.info("Loan approved and money transferred: {}", loan.getId());
            }

            loanRepository.save(loan);

        } catch (Exception e) {
            log.error("Error approving loan: {}", loan.getId(), e);
            loan.setStatus(LoanStatus.REJECTED);
            loanRepository.save(loan);
        }
    }


    private void rejectLoan(Loan loan) {
        loan.setStatus(LoanStatus.REJECTED);
        loanRepository.save(loan);
    }

}
