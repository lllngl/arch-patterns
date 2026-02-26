package com.internetbank.mapper;

import com.internetbank.db.model.AccountLoan;
import com.internetbank.db.model.Loan;
import com.internetbank.db.model.Tariff;
import com.internetbank.dto.response.AccountLoanResponse;
import com.internetbank.dto.response.LoanResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface LoanMapper {

    @Mapping(source = "loan.id", target = "id")
    @Mapping(source = "loan.amount", target = "amount")
    @Mapping(source = "loan.termMonths", target = "termMonths")
    @Mapping(source = "accountLoan.status", target = "status")
    @Mapping(source = "accountLoan.createdAt", target = "createdAt")
    @Mapping(source = "tariff", target = "tariff")
    LoanResponse toLoanResponse(Loan loan, AccountLoan accountLoan, Tariff tariff);

    @Mapping(source = "accountLoan.id", target = "id")
    @Mapping(source = "accountLoan.accountId", target = "accountId")
    @Mapping(source = "accountLoan.loanId", target = "loanId")
    @Mapping(source = "accountLoan.status", target = "status")
    @Mapping(source = "accountLoan.monthlyPayment", target = "monthlyPayment")
    @Mapping(source = "accountLoan.remainingAmount", target = "remainingAmount")
    @Mapping(source = "accountLoan.nextPaymentDate", target = "nextPaymentDate")
    @Mapping(source = "accountLoan.paymentDate", target = "paymentDate")
    @Mapping(source = "accountLoan.createdAt", target = "createdAt")
    @Mapping(target = "loanDetails", expression = "java(toLoanResponse(loan, accountLoan, tariff))")
    AccountLoanResponse toAccountLoanResponse(AccountLoan accountLoan, Loan loan, Tariff tariff);
}