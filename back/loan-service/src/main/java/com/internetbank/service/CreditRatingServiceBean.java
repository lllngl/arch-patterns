package com.internetbank.service;

import com.internetbank.db.model.Loan;
import com.internetbank.db.model.enums.LoanStatus;
import com.internetbank.db.model.enums.PaymentStatus;
import com.internetbank.db.repository.LoanRepository;
import com.internetbank.db.repository.PaymentHistoryRepository;
import com.internetbank.dto.response.CreditRatingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreditRatingServiceBean implements CreditRatingService {

    private final LoanRepository loanRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;

    private static final int MAX_SCORE = 1000;
    private static final int MIN_SCORE = 0;
    private static final List<PaymentStatus> OVERDUE_STATUSES = List.of(
            PaymentStatus.OVERDUE,
            PaymentStatus.LATE
    );

    @Override
    @Transactional(readOnly = true)
    public CreditRatingResponse calculateCreditRating(UUID userId) {
        log.info("Calculating credit rating for user: {}", userId);

        List<Loan> userLoans = loanRepository.findByUserId(userId);
        List<Loan> activeLoans = userLoans.stream()
                .filter(loan -> loan.getStatus() == LoanStatus.ACTIVE)
                .toList();
        List<Loan> paidLoans = userLoans.stream()
                .filter(loan -> loan.getStatus() == LoanStatus.PAID)
                .toList();
        List<Loan> overdueLoans = userLoans.stream()
                .filter(loan -> loan.getStatus() == LoanStatus.OVERDUE)
                .toList();

        BigDecimal totalPenalties = Optional.ofNullable(paymentHistoryRepository.getTotalPenalties(userId))
                .orElse(BigDecimal.ZERO);

        BigDecimal totalOverdueAmount = Optional.ofNullable(paymentHistoryRepository.getTotalOverdueAmount(userId, OVERDUE_STATUSES))
                .orElse(BigDecimal.ZERO);

        LocalDate lastOverdueDate = paymentHistoryRepository.getLastOverdueDate(userId, OVERDUE_STATUSES);
        long overduePaymentsCount = paymentHistoryRepository.countLatePayments(userId, OVERDUE_STATUSES);

        int score = calculateScore(userLoans.size(), paidLoans.size(), overdueLoans.size(), overduePaymentsCount,
                totalPenalties, totalOverdueAmount);

        BigDecimal creditUtilization = calculateCreditUtilization(activeLoans);

        return CreditRatingResponse.builder()
                .score(score)
                .grade(getGrade(score))
                .totalLoans(userLoans.size())
                .activeLoans(activeLoans.size())
                .paidLoans(paidLoans.size())
                .overdueCount((int) overduePaymentsCount)
                .totalPenalties(totalPenalties)
                .totalOverdueAmount(totalOverdueAmount)
                .lastOverdueDate(lastOverdueDate)
                .creditUtilization(creditUtilization)
                .isEligibleForNewLoan(isEligibleForNewLoan(score, overdueLoans.size(), totalOverdueAmount))
                .build();
    }

    private int calculateScore(int totalLoans, int paidLoans, int overdueLoansCount,
                               long overduePayments, BigDecimal penalties, BigDecimal overdueAmount) {

        int baseScore = 700;

        if (totalLoans > 0) {
            double successRate = (double) paidLoans / totalLoans;
            baseScore += (int) (successRate * 200);
        }

        if (overdueLoansCount > 0) baseScore -= Math.min(150, overdueLoansCount * 50);

        if (overduePayments > 0) baseScore -= (int) Math.min(200, overduePayments * 25);

        int penaltiesPenalty = Optional.ofNullable(penalties)
                .filter(p -> p.compareTo(BigDecimal.ZERO) > 0)
                .map(p -> p.min(BigDecimal.valueOf(100000))
                        .divide(BigDecimal.valueOf(100000), 2, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .intValue())
                .orElse(0);

        int overdueAmountPenalty = Optional.ofNullable(overdueAmount)
                .filter(o -> o.compareTo(BigDecimal.ZERO) > 0)
                .map(o -> o.min(new BigDecimal("500000"))
                        .divide(new BigDecimal("500000"), 2, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                        .intValue())
                .orElse(0);

        int paidLoansBonus = Optional.of(paidLoans)
                .map(p -> (p >= 10 ? 100 : p >= 5 ? 50 : 0))
                .orElse(0);

        int score = baseScore - penaltiesPenalty - overdueAmountPenalty + paidLoansBonus;

        return Math.clamp(score, MIN_SCORE, MAX_SCORE);
    }

    private String getGrade(int score) {
        return Optional.of(score)
                .map(s -> {
                    if (s >= 850) return "A (Excellent)";
                    if (s >= 750) return "B (Good)";
                    if (s >= 650) return "C (Fair)";
                    if (s >= 550) return "D (Poor)";
                    if (s >= 450) return "E (Very Poor)";
                    return "F (Default)";
                })
                .orElse("F (Default)");
    }

    private BigDecimal calculateCreditUtilization(List<Loan> activeLoans) {
        return Optional.of(activeLoans)
                .filter(list -> !list.isEmpty())
                .map(loans -> {
                    BigDecimal totalRemaining = loans.stream()
                            .map(Loan::getRemainingAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal totalOriginal = loans.stream()
                            .map(Loan::getAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return Optional.of(totalOriginal)
                            .filter(original -> original.compareTo(BigDecimal.ZERO) != 0)
                            .map(original -> totalRemaining.divide(original, 4, RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100)))
                            .orElse(BigDecimal.ZERO);
                })
                .orElse(BigDecimal.ZERO);
    }

    private boolean isEligibleForNewLoan(int score, int overdueLoansCount, BigDecimal totalOverdueAmount) {
        return Optional.of(score >= 450)
                .filter(Boolean::booleanValue)
                .flatMap(eligible -> Optional.of(overdueLoansCount == 0)
                        .filter(Boolean::booleanValue)
                        .map(noOverdueLoans -> Optional.ofNullable(totalOverdueAmount)
                                .map(amount -> amount.compareTo(BigDecimal.valueOf(5000)) <= 0)
                                .orElse(true)))
                .orElse(false);
    }
}