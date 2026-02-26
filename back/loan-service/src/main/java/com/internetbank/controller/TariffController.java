package com.internetbank.controller;

import com.internetbank.dto.request.CreateTariffRequest;
import com.internetbank.dto.response.TariffResponse;
import com.internetbank.service.TariffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tariffs")
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
    public ResponseEntity<List<TariffResponse>> getAllTariffs() {
        return ResponseEntity.ok(tariffService.getAllTariffs());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TariffResponse> getTariff(@PathVariable UUID id) {
        return ResponseEntity.ok(tariffService.getTariff(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<TariffResponse> updateTariff(@PathVariable UUID id, @Valid @RequestBody CreateTariffRequest request) {
        return ResponseEntity.ok(tariffService.updateTariff(id, request));
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