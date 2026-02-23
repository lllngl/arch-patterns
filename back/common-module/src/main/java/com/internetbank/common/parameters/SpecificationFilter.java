package com.internetbank.common.parameters;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class SpecificationFilter {

    public <T> Specification<T> applyFilters(
            Map<String, Object> filters
    ) {
        Specification<T> result = (root, query, cb) -> null;

        for (Map.Entry<String, Object> entry : filters.entrySet()) {
            Object value = entry.getValue();
            if (value == null) {
                continue;
            }
            if (value instanceof String s && s.isEmpty()) {
                continue;
            }

            result = result.and(createFieldSpecification(entry.getKey(), value));
        }
        return result;
    }

    private <T> Specification<T> createFieldSpecification(String field, Object value) {
        return (root, query, cb) -> {
            if (value instanceof String strValue && !strValue.isEmpty()) {
                return cb.like(cb.lower(root.get(field)), "%" + strValue.toLowerCase() + "%");
            }
            return cb.equal(root.get(field), value);
        };
    }
}

