package com.internetbank.mapper;

import com.internetbank.db.model.UserPreferences;
import com.internetbank.dto.response.UserPreferencesResponse;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserPreferencesMapper {

    UserPreferencesResponse toDto(UserPreferences entity);

    UserPreferences toEntity(UserPreferencesResponse dto);
}