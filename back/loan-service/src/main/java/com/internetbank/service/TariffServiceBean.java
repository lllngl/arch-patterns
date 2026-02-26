package com.internetbank.service;

import com.internetbank.common.exceptions.BadRequestException;
import com.internetbank.common.exceptions.NotFoundException;
import com.internetbank.db.model.Tariff;
import com.internetbank.db.repository.TariffRepository;
import com.internetbank.dto.request.CreateTariffRequest;
import com.internetbank.dto.response.TariffResponse;
import com.internetbank.mapper.TariffMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TariffServiceBean implements TariffService {

    private final TariffRepository tariffRepository;
    private final TariffMapper tariffMapper;

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
    public List<TariffResponse> getAllTariffs() {
        return tariffRepository.findAll().stream()
                .map(tariffMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TariffResponse getTariff(UUID id) {
        Tariff tariff = tariffRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tariff not found: " + id));

        return tariffMapper.toResponse(tariff);
    }

    @Override
    @Transactional
    public TariffResponse updateTariff(UUID id, CreateTariffRequest request) {
        Tariff tariff = tariffRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tariff not found: " + id));

        tariffMapper.updateEntity(request, tariff);
        tariff = tariffRepository.save(tariff);

        log.info("Tariff updated: {}", id);

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
