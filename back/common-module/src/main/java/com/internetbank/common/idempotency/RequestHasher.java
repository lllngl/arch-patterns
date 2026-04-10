package com.internetbank.common.idempotency;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Slf4j
@Component
@RequiredArgsConstructor
public class RequestHasher {

    private final ObjectMapper objectMapper;

    public String hashRequest(Object requestBody) {
        try {
            if (requestBody == null) {
                return "";
            }

            String json = objectMapper.writeValueAsString(requestBody);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(json.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);

        } catch (Exception e) {
            log.error("Ошибка при вычислении хеша запроса", e);
            return "";
        }
    }


    public String hashRequestFromWrapper(ContentCachingRequestWrapper request) {
        try {
            byte[] content = request.getContentAsByteArray();
            if (content.length == 0) {
                return "";
            }

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content);
            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException e) {
            log.error("Ошибка при вычислении хеша запроса", e);
            return "";
        }
    }
}