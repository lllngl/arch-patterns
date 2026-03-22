package com.internetbank.service;

import com.internetbank.common.dtos.page.PageRequestParams;
import com.internetbank.common.security.AuthenticatedUser;
import com.internetbank.db.model.enums.LoanStatus;
import com.internetbank.dto.request.CreateLoanRequest;
import com.internetbank.dto.request.RepayLoanRequest;
import com.internetbank.dto.response.CreditRatingResponse;
import com.internetbank.dto.response.LoanResponse;
import com.internetbank.dto.response.PaymentHistoryResponse;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface LoanService {

    LoanResponse createLoan(CreateLoanRequest request);

    LoanResponse repayLoan(UUID accountLoanId, RepayLoanRequest request);

    LoanResponse getLoan(UUID loanId, AuthenticatedUser user);

    Page<LoanResponse> getAllLoans(PageRequestParams pageParams, LoanStatus status);

    Page<LoanResponse> getLoansByUser(UUID userId, PageRequestParams pageParams, LoanStatus status);

    Page<LoanResponse> getMyLoans(UUID userId, PageRequestParams pageParams, LoanStatus status, AuthenticatedUser user);

    Page<PaymentHistoryResponse> getOverduePaymentsByUser(UUID userId, PageRequestParams pageParams, AuthenticatedUser user);

    Page<PaymentHistoryResponse> getOverduePaymentsByLoan(UUID loanId, PageRequestParams pageParams, AuthenticatedUser user);

    CreditRatingResponse getCreditRating(UUID userId, AuthenticatedUser user);

    void rejectLoan(UUID loanId);

    void approveLoan(UUID loanId);
}
