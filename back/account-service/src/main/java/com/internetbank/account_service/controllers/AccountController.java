package com.internetbank.account_service.controllers;

import com.internetbank.account_service.dtos.AccountCreateRequest;
import com.internetbank.common.clients.UserAppClient;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.common.dtos.AccountTransactionDTO;
import com.internetbank.account_service.dtos.MoneyOperationRequest;
import com.internetbank.account_service.dtos.RenameAccountRequest;
import com.internetbank.account_service.enums.AccountStatus;
import com.internetbank.account_service.enums.TransactionType;
import com.internetbank.account_service.services.AccountService;
import com.internetbank.common.dtos.UserDTO;
import com.internetbank.common.dtos.page.PageRequestParams;
import com.internetbank.common.parameters.PageableUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.method.P;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Slf4j
public class AccountController {

    private final AccountService accountService;
    private final PageableUtils pageableUtils;
    private final UserAppClient userAppClient;

    @PostMapping("/{userId}")
    @PreAuthorize("hasRole('EMPLOYEE') or #userId == principal.id")
    public ResponseEntity<AccountDTO> createAccount(
            @PathVariable("userId") @P("userId") UUID userId,
            @RequestBody(required = false) @Valid AccountCreateRequest request) {
        AccountDTO response = accountService.createAccount(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{accountId}/close")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> closeAccountStatus(
            @PathVariable("accountId") UUID accountId,
            @AuthenticationPrincipal UserDTO user) {
        accountService.closeAccount(accountId, user);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{accountId}/open")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AccountDTO> openAccountStatus(
            @PathVariable("accountId") UUID accountId,
            @AuthenticationPrincipal UserDTO user) {
        AccountDTO response = accountService.openAccount(accountId, user);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{accountId}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> deleteAccount(
            @PathVariable("accountId") UUID accountId) {
        accountService.deleteAccount(accountId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{accountId}/deposit")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<AccountDTO> deposit(
            @PathVariable("accountId") UUID accountId,
            @RequestBody @Valid MoneyOperationRequest request,
            @AuthenticationPrincipal UserDTO user) {
        AccountDTO response = accountService.deposit(accountId, request, user);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{accountId}/withdraw")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<AccountDTO> withdraw(
            @PathVariable("accountId") UUID accountId,
            @RequestBody @Valid MoneyOperationRequest request,
            @AuthenticationPrincipal UserDTO user) {
        AccountDTO response = accountService.withdraw(accountId, request, user);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{accountId}/name")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AccountDTO> rename(
            @PathVariable("accountId") UUID accountId,
            @RequestBody @Valid RenameAccountRequest request,
            @AuthenticationPrincipal UserDTO user) {
        AccountDTO response = accountService.rename(accountId, request, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{accountId}/transactions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<AccountTransactionDTO>> getTransactions(
            @PathVariable("accountId") UUID accountId,
            @AuthenticationPrincipal UserDTO user,
            @ParameterObject PageRequestParams pageRequestParams,
            @RequestParam(name = "fromDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(name = "toDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(name = "type", required = false) TransactionType type) {

        Pageable pageable = pageableUtils.of(pageRequestParams);
        Page<AccountTransactionDTO> response = accountService.getTransactions(accountId, user, pageable, fromDate, toDate, type);
        return ResponseEntity.ok(response);

    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('EMPLOYEE') or #userId == principal.id")
    public ResponseEntity<Page<AccountDTO>> getUserAccounts(
            @PathVariable("userId") @P("userId") UUID userId,
            @ParameterObject PageRequestParams pageRequestParams,
            @RequestParam(name = "status", required = false) List<AccountStatus> statuses) {

        Pageable pageable = pageableUtils.of(pageRequestParams);
        Page<AccountDTO> response = accountService.getUserAccounts(userId, pageable, statuses);
        return ResponseEntity.ok(response);

    }

    @GetMapping("/{accountId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AccountDTO> getAccountById(
            @PathVariable("accountId") UUID accountId,
            @AuthenticationPrincipal UserDTO user) {
        AccountDTO response = accountService.getAccountById(accountId, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{accountId}/internal")
    @PreAuthorize("@internalSecurity.hasInternalAccess()")
    public ResponseEntity<AccountDTO> getAccountByIdInternal(
            @PathVariable("accountId") UUID accountId,
            @RequestParam("userId") UUID userId) {

        UserDTO user = userAppClient.getUserById(userId);
        AccountDTO response = accountService.getAccountById(accountId, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Page<AccountDTO>> getAllAccounts(
            @ParameterObject PageRequestParams pageRequestParams,
            @RequestParam(name = "status", required = false) List<AccountStatus> statuses) {

        Pageable pageable = pageableUtils.of(pageRequestParams);
        Page<AccountDTO> response = accountService.getAllAccounts(pageable, statuses);
        return ResponseEntity.ok(response);

    }
}

