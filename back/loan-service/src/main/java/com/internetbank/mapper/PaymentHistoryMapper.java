package com.internetbank.mapper;

import com.internetbank.db.model.PaymentHistory;
import com.internetbank.dto.response.PaymentHistoryResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PaymentHistoryMapper {

    @Mapping(source = "paymentHistory.id", target = "paymentId")
    @Mapping(source = "paymentHistory.loanId", target = "loanId")
    @Mapping(source = "paymentHistory.paymentAmount", target = "paymentAmount")
    @Mapping(source = "paymentHistory.paymentCurrency", target = "currencyCode")
    @Mapping(source = "paymentHistory.exchangeRateAtPayment", target = "paymentAmountInLoanCurrency")
    @Mapping(source = "paymentHistory.loanCurrency", target = "loanCurrencyCode")
    @Mapping(source = "paymentHistory.expectedPaymentDate", target = "expectedPaymentDate")
    @Mapping(source = "paymentHistory.actualPaymentDate", target = "actualPaymentDate")
    @Mapping(source = "paymentHistory.status", target = "status")
    @Mapping(source = "paymentHistory.penaltyAmount", target = "penaltyAmount")
    PaymentHistoryResponse toPaymentHistoryResponse(PaymentHistory paymentHistory);
}
