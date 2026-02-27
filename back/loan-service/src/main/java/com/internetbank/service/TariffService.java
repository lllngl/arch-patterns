package com.internetbank.service;

import com.internetbank.common.dtos.page.PageRequestParams;
import com.internetbank.dto.request.CreateTariffRequest;
import com.internetbank.dto.response.TariffResponse;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface TariffService {

    TariffResponse createTariff(CreateTariffRequest request);

    Page<TariffResponse> getAllTariffs(PageRequestParams pageParams, Boolean active);

    TariffResponse getTariff(UUID id);

    void activateTariff(UUID id);

    void deactivateTariff(UUID id);
}
