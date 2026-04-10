package com.internetbank.common.idempotency;

import com.internetbank.common.exceptions.BadRequestException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.LocalDateTime;

@Slf4j
@RequiredArgsConstructor
public class IdempotencyInterceptor implements HandlerInterceptor {

    private static final String IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

    private final IdempotencyStore idempotencyStore;
    private final RequestHasher requestHasher;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {

        String method = request.getMethod();
        if (!HttpMethod.POST.matches(method) &&
                !HttpMethod.PUT.matches(method) &&
                !HttpMethod.PATCH.matches(method)) {
            return true;
        }

        String idempotencyKey = request.getHeader(IDEMPOTENCY_KEY_HEADER);

        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new BadRequestException("Header 'Idempotency-Key' обязателен для этого запроса");
        }

        IdempotencyRecord existingRecord = idempotencyStore.get(idempotencyKey);

        if (existingRecord != null) {
            log.info("Обнаружен повторный запрос с ключом: {}", idempotencyKey);

            request.setAttribute("idempotency.previousResult", existingRecord.getResult());
            request.setAttribute("idempotency.key", idempotencyKey);

            return false;
        }

        request.setAttribute("idempotency.key", idempotencyKey);
        request.setAttribute("idempotency.isNew", true);

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {

        if (ex != null || response.getStatus() >= 500) {
            return;
        }

        String idempotencyKey = (String) request.getAttribute("idempotency.key");
        Boolean isNew = (Boolean) request.getAttribute("idempotency.isNew");
        Object result = request.getAttribute("idempotency.result");

        if (isNew != null && isNew && idempotencyKey != null && result != null) {

            IdempotencyRecord record = new IdempotencyRecord(
                    idempotencyKey,
                    result,
                    LocalDateTime.now(),
                    requestHasher.hashRequest(request),
                    LocalDateTime.now().plusSeconds(300)
            );

            idempotencyStore.store(idempotencyKey, record);
            log.info("Сохранён результат для ключа {} (TTL: {} сек)", idempotencyKey, 300);
        }
    }
}