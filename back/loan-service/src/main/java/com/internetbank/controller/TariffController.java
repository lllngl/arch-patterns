package com.internetbank.controller;

import com.internetbank.common.dtos.page.PageRequestParams;
import com.internetbank.dto.request.CreateTariffRequest;
import com.internetbank.dto.response.TariffResponse;
import com.internetbank.service.TariffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tariffs")
@RequiredArgsConstructor
public class TariffController {

    private final TariffService tariffService;

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<TariffResponse> createTariff(@Valid @RequestBody CreateTariffRequest request) {
        TariffResponse response = tariffService.createTariff(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<TariffResponse>> getAllTariffs(
            @ParameterObject PageRequestParams pageParams,
            @RequestParam(required = false) Boolean active
            ) {
        return ResponseEntity.ok(tariffService.getAllTariffs(pageParams, active));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TariffResponse> getTariff(@PathVariable UUID id) {
        return ResponseEntity.ok(tariffService.getTariff(id));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> activateTariff(@PathVariable UUID id) {
        tariffService.activateTariff(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Void> deactivateTariff(@PathVariable UUID id) {
        tariffService.deactivateTariff(id);
        return ResponseEntity.ok().build();
    }
}