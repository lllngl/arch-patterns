package com.internetbank.controller;

import com.internetbank.common.dtos.page.PageRequestParams;
import com.internetbank.common.security.AuthenticatedUser;
import com.internetbank.dto.response.PaymentHistoryResponse;
import com.internetbank.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/loan/payments")
@RequiredArgsConstructor
public class PaymentHistoryController {

    private final LoanService loanService;

    @GetMapping("/overdue/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<PaymentHistoryResponse>> getOverduePaymentsByUser(@PathVariable UUID userId,
                                                                                 @ParameterObject PageRequestParams pageParams,
                                                                                 @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(loanService.getOverduePaymentsByUser(userId, pageParams, user));
    }

    @GetMapping("/overdue/loan/{loanId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<PaymentHistoryResponse>> getOverduePaymentsByLoan(@PathVariable UUID loanId,
                                                                                 @ParameterObject PageRequestParams pageParams,
                                                                                 @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(loanService.getOverduePaymentsByLoan(loanId, pageParams, user));
    }
}
