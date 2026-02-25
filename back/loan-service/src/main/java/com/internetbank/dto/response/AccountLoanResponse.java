package com.internetbank.dto.response;

import com.internetbank.db.model.enums.LoanStatus;
import com.internetbank.db.model.enums.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AccountLoanResponse (

        UUID id,
        UUID accountId,
        UUID loanId,
        LoanStatus status,
        PaymentType paymentType,
        BigDecimal monthlyPayment,
        BigDecimal remainingAmount,
        LocalDate nextPaymentDate,
        LocalDate paymentDate,
        LocalDate createdAt,
        LoanResponse loanDetails

) {
}
