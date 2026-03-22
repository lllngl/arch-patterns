package com.internetbank.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
public record CreditRatingResponse(
        Integer score,
        String grade,
        Integer totalLoans,
        Integer activeLoans,
        Integer paidLoans,
        Integer overdueCount,
        BigDecimal totalPenalties,
        BigDecimal totalOverdueAmount,
        LocalDate lastOverdueDate,
        BigDecimal creditUtilization, // коэффициент использования кредитного лимита
        Boolean isEligibleForNewLoan
) {}