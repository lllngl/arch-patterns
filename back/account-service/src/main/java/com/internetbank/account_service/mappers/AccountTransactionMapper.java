package com.internetbank.account_service.mappers;

import com.internetbank.common.dtos.AccountTransactionDTO;
import com.internetbank.account_service.enums.TransactionType;
import com.internetbank.account_service.models.AccountTransaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface AccountTransactionMapper {
    @Mapping(target = "type", source = "type", qualifiedByName = "mapTypeToString")
    AccountTransactionDTO toDto(AccountTransaction transaction);

    @Named("mapTypeToString")
    default String mapTypeToString(TransactionType type) {
        return type != null ? type.name() : null;
    }
}



