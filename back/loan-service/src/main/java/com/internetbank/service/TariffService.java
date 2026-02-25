package com.internetbank.service;

import com.internetbank.dto.request.CreateTariffRequest;
import com.internetbank.dto.response.TariffResponse;

import java.util.List;
import java.util.UUID;

public interface TariffService {

    TariffResponse createTariff(CreateTariffRequest request);

    List<TariffResponse> getAllTariffs();

    TariffResponse getTariff(UUID id);

    TariffResponse updateTariff(UUID id, CreateTariffRequest request);

    void activateTariff(UUID id);

    void deactivateTariff(UUID id);
}
