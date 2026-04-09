package com.internetbank.service.scheduler;

import com.internetbank.db.model.Loan;
import com.internetbank.db.model.enums.LoanStatus;
import com.internetbank.db.repository.LoanRepository;
import com.internetbank.dto.request.RepayLoanRequest;
import com.internetbank.dto.response.CreditRatingResponse;
import com.internetbank.service.CreditRatingService;
import com.internetbank.service.LoanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final CreditRatingService creditRatingService;
    private final LoanService loanService;

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
                loanService.repayLoan(loan.getId(),
                        RepayLoanRequest.builder()
                                .userId(loan.getUserId())
                                .accountId(loan.getAccountId())
                                .amount(loan.getMonthlyPayment())
                                .currency(loan.getCurrencyCode())
                                .build());
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
                CreditRatingResponse creditRating = creditRatingService.calculateCreditRating(loan.getUserId());
                boolean shouldApprove = evaluateLoanApplication(loan, creditRating);

                if (shouldApprove) {
                    loanService.approveLoan(loan.getId());
                    approved++;
                    log.info("Loan {} approved. Rating: {}, Score: {}",
                            loan.getId(), creditRating.grade(), creditRating.score());
                } else {
                    loanService.rejectLoan(loan.getId());
                    rejected++;
                    log.info("Loan {} rejected automatically. Rating: {}, Score: {}",
                            loan.getId(), creditRating.grade(), creditRating.score());
                }
            } catch (Exception e) {
                log.error("Error processing pending loan: {}", loan.getId(), e);
                failed++;
            }
        }

        log.info("Pending loans processing completed. Approved: {}, Rejected: {}, Failed: {}",
                approved, rejected, failed);
    }

    private void markAsOverdue(Loan loan) {
        if (loan.getStatus() == LoanStatus.ACTIVE) {
            loan.setStatus(LoanStatus.OVERDUE);
            loanRepository.save(loan);
            log.warn("Loan marked as overdue: {}", loan.getId());
        }
    }

    private boolean evaluateLoanApplication(Loan loan, CreditRatingResponse rating) {
        log.debug("Evaluating loan application: {}", loan.getId());
        if (rating.score() >= 750) {
            return true;
        }

        if (rating.score() >= 650) {
            return loan.getAmount().compareTo(BigDecimal.valueOf(1000000)) <= 0;
        }

        if (rating.score() >= 550) {
            if (loan.getAmount().compareTo(BigDecimal.valueOf(500000)) > 0) {
                return false;
            }

            return rating.totalOverdueAmount() == null ||
                    rating.totalOverdueAmount().compareTo(BigDecimal.valueOf(10000)) <= 0;
        }

        return false;
    }

}
