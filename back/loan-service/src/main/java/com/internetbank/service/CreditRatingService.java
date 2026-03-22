package com.internetbank.service;

import com.internetbank.dto.response.CreditRatingResponse;

import java.util.UUID;

public interface CreditRatingService {

    CreditRatingResponse calculateCreditRating(UUID userId);
}
