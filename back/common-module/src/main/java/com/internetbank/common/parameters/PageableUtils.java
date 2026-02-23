package com.internetbank.common.parameters;

import com.internetbank.common.dtos.page.PageRequestParams;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
public class PageableUtils {
    public Pageable of(PageRequestParams pageRequestParams) {
        Sort sort = pageRequestParams.sortDir().name().equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(pageRequestParams.sortBy()).ascending()
                : Sort.by(pageRequestParams.sortBy()).descending();
        return PageRequest.of(pageRequestParams.page(), pageRequestParams.size(), sort);
    }
}

