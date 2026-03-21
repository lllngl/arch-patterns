package com.internetbank.controller;

import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.dtos.page.PageRequestParams;
import com.internetbank.common.security.AuthenticatedUser;
import com.internetbank.db.model.enums.LoanStatus;
import com.internetbank.dto.request.CreateLoanRequest;
import com.internetbank.dto.request.RepayLoanRequest;
import com.internetbank.dto.response.LoanResponse;
import com.internetbank.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.method.P;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/loan")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<LoanResponse> createLoan(@Valid @RequestBody CreateLoanRequest request) {
        LoanResponse response = loanService.createLoan(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Page<LoanResponse>> getAllLoans(@ParameterObject PageRequestParams pageParams,
                                                          @RequestParam(required = false) LoanStatus status) {
        return ResponseEntity.ok(loanService.getAllLoans(pageParams, status));
    }

    @PatchMapping("/{loanId}/reject")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> rejectLoan(@PathVariable UUID loanId) {
        loanService.rejectLoan(loanId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{loanId}/approve")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> approveLoan(@PathVariable UUID loanId) {
        loanService.approveLoan(loanId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{loanId}/repay")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LoanResponse> repayLoan(@PathVariable UUID loanId,
                                                  @Valid @RequestBody RepayLoanRequest request) {
        return ResponseEntity.ok(loanService.repayLoan(loanId, request));
    }

    @GetMapping("/{loanId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LoanResponse> getLoan(@PathVariable UUID loanId,
                                                @AuthenticationPrincipal AuthenticatedUser user) {
        LoanResponse response = loanService.getLoan(loanId, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Page<LoanResponse>> getLoansByUser(@PathVariable("userId") @P("userId") UUID userId,
                                                             @ParameterObject PageRequestParams pageParams,
                                                             @RequestParam(required = false) LoanStatus status) {
        return ResponseEntity.ok(loanService.getLoansByUser(userId, pageParams, status));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Page<LoanResponse>> getLoansForClient(@ParameterObject PageRequestParams pageParams,
                                                                @RequestParam(required = false) LoanStatus status,
                                                                @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(loanService.getMyLoans(user.getId(), pageParams, status, user));
    }
}