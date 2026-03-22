package com.internetbank.account_service.services;

import com.internetbank.account_service.enums.AccountType;
import com.internetbank.account_service.models.Account;
import com.internetbank.account_service.repositories.AccountRepository;
import com.internetbank.common.enums.RoleName;
import com.internetbank.common.exceptions.ForbiddenException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.common.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountRealtimeAccessService {

    private final AccountRepository accountRepository;

    public void ensureCanSubscribe(UUID accountId, AuthenticatedUser user) {
        if (user == null) {
            throw new ForbiddenException("Authentication is required for account updates.");
        }

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new NotFoundException("Account not found with ID: " + accountId));

        if (account.getType() != AccountType.CUSTOMER) {
            throw new NotFoundException("Account not found with ID: " + accountId);
        }

        boolean employee = user.hasRole(RoleName.EMPLOYEE);
        if (user.getId() == null || (!employee && !account.getUserId().equals(user.getId()))) {
            throw new ForbiddenException("You are not authorized to subscribe to this account.");
        }
    }
}
