package com.internetbank.common.idempotency;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class IdempotencyStore {

    private final Map<String, IdempotencyRecord> store = new ConcurrentHashMap<>();

    public void store(String key, IdempotencyRecord record) {
        store.put(key, record);
        log.debug("Сохранён результат для ключа: {}, expires at: {}", key, record.getExpiresAt());
    }

    public IdempotencyRecord get(String key) {
        IdempotencyRecord record = store.get(key);

        if (record == null) {
            return null;
        }

        if (record.isExpired()) {
            store.remove(key);
            log.debug("Удалён просроченный ключ: {}", key);
            return null;
        }

        return record;
    }

    public boolean exists(String key) {
        IdempotencyRecord record = store.get(key);
        if (record == null) {
            return false;
        }

        if (record.isExpired()) {
            store.remove(key);
            return false;
        }

        return true;
    }

    public void evict(String key) {
        store.remove(key);
        log.debug("Принудительно удалён ключ: {}", key);
    }


    @Scheduled(fixedDelay = 300000)
    public void cleanExpiredRecords() {
        int beforeSize = store.size();
        store.entrySet().removeIf(entry -> entry.getValue().isExpired());
        int afterSize = store.size();

        if (beforeSize != afterSize) {
            log.info("Очистка идемпотентных записей: удалено {} просроченных записей", beforeSize - afterSize);
        }
    }

    public int size() {
        return store.size();
    }
}