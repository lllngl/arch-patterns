package com.internetbank.account_service.mappers;

import com.internetbank.account_service.dtos.AccountCreateRequest;
import com.internetbank.common.dtos.AccountDTO;
import com.internetbank.account_service.enums.AccountStatus;
import com.internetbank.account_service.models.Account;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring")
public interface AccountMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "balance", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "modifiedAt", ignore = true)
    @Mapping(target = "modifiedBy", ignore = true)
    Account toEntity(AccountCreateRequest request);

    @Mapping(target = "status", source = "status", qualifiedByName = "mapAccountStatusToString")
    AccountDTO toDto(Account account);

    @Named("mapAccountStatusToString")
    default String mapAccountStatusToString(AccountStatus status) {
        return status != null ? status.name() : null;
    }
}

