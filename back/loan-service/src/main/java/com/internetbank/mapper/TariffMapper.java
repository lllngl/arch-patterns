package com.internetbank.mapper;

import com.internetbank.db.model.Tariff;
import com.internetbank.dto.request.CreateTariffRequest;
import com.internetbank.dto.response.TariffResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TariffMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "isActive", constant = "true")
    Tariff toEntity(CreateTariffRequest request);

    TariffResponse toResponse(Tariff tariff);

    @Mapping(target = "id", ignore = true)
    void updateEntity(CreateTariffRequest request, @MappingTarget Tariff tariff);
}