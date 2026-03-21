package com.internetbank.service;

import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.dtos.page.PageRequestParams;
import com.internetbank.common.security.AuthenticatedUser;
import com.internetbank.db.model.enums.LoanStatus;
import com.internetbank.dto.request.CreateLoanRequest;
import com.internetbank.dto.request.RepayLoanRequest;
import com.internetbank.dto.response.LoanResponse;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface LoanService {

    LoanResponse createLoan(CreateLoanRequest request);

    LoanResponse repayLoan(UUID accountLoanId, RepayLoanRequest request);

    LoanResponse getLoan(UUID loanId, AuthenticatedUser user);

    Page<LoanResponse> getAllLoans(PageRequestParams pageParams, LoanStatus status);

    Page<LoanResponse> getLoansByUser(UUID userId, PageRequestParams pageParams, LoanStatus status);

    Page<LoanResponse> getMyLoans(UUID userId, PageRequestParams pageParams, LoanStatus status, AuthenticatedUser user);

    void rejectLoan(UUID loanId);

    void approveLoan(UUID loanId);
}
