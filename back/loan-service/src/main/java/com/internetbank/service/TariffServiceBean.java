package com.internetbank.service;

import com.internetbank.common.dtos.page.PageRequestParams;
import com.internetbank.common.exceptions.BadRequestException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.common.parameters.PageableUtils;
import com.internetbank.db.model.Tariff;
import com.internetbank.db.repository.TariffRepository;
import com.internetbank.dto.request.CreateTariffRequest;
import com.internetbank.dto.response.TariffResponse;
import com.internetbank.mapper.TariffMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TariffServiceBean implements TariffService {

    private final TariffRepository tariffRepository;
    private final TariffMapper tariffMapper;
    private final PageableUtils pageableUtils;

    @Override
    @Transactional
    public TariffResponse createTariff(CreateTariffRequest request) {

        log.info("Creating new tariff: {}", request.name());

        if (request.minAmount().compareTo(request.maxAmount()) > 0) throw new BadRequestException("Min amount cannot be greater than max amount");
        if (request.minTermMonths() > request.maxTermMonths()) throw new BadRequestException("Min term cannot be greater than max term");

        Tariff tariff = tariffRepository.save(tariffMapper.toEntity(request));

        log.info("Tariff created successfully. ID: {}", tariff);

        return tariffMapper.toResponse(tariff);
    }

    @Override
    public Page<TariffResponse> getAllTariffs(PageRequestParams pageParams, Boolean active) {
        Pageable pageable = pageableUtils.of(pageParams);

        Page<Tariff> tariffsPage = active != null
                ? tariffRepository.findByActive(active, pageable)
                : tariffRepository.findAll(pageable);

        return tariffsPage.map(tariffMapper::toResponse);
    }

    @Override
    public TariffResponse getTariff(UUID id) {
        Tariff tariff = tariffRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tariff not found: " + id));

        return tariffMapper.toResponse(tariff);
    }

    @Override
    @Transactional
    public void activateTariff(UUID id) {
        Tariff tariff = tariffRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tariff not found: " + id));

        tariff.setActive(true);
        Tariff newTariff = tariffRepository.save(tariff);

        log.info("Tariff activated: {}", newTariff);
    }

    @Override
    @Transactional
    public void deactivateTariff(UUID id) {
        Tariff tariff = tariffRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tariff not found: " + id));

        tariff.setActive(false);
        tariffRepository.save(tariff);

        log.info("Tariff deactivated: {}", id);
    }
}
