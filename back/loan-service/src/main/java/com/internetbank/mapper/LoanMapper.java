package com.internetbank.mapper;

import com.internetbank.db.model.Loan;
import com.internetbank.db.model.Tariff;
import com.internetbank.dto.response.LoanResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface LoanMapper {

    @Mapping(source = "loan.id", target = "id")
    @Mapping(source = "loan.userId", target = "userId")
    @Mapping(source = "loan.accountId", target = "accountId")
    @Mapping(source = "loan.amount", target = "amount")
    @Mapping(source = "loan.termMonths", target = "termMonths")
    @Mapping(source = "loan.status", target = "status")
    @Mapping(source = "loan.paymentType", target = "paymentType")
    @Mapping(source = "loan.monthlyPayment", target = "monthlyPayment")
    @Mapping(source = "loan.remainingAmount", target = "remainingAmount")
    @Mapping(source = "loan.nextPaymentDate", target = "nextPaymentDate")
    @Mapping(source = "loan.paymentDate", target = "paymentDate")
    @Mapping(source = "loan.createdAt", target = "createdAt")
    @Mapping(source = "tariff", target = "tariff")
    LoanResponse toLoanResponse(Loan loan, Tariff tariff);
}