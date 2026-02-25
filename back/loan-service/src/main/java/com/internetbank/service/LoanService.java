package com.internetbank.service;

import com.internetbank.dto.request.CreateLoanRequest;
import com.internetbank.dto.response.LoanResponse;

public interface LoanService {

    LoanResponse createLoan(CreateLoanRequest request);
}
