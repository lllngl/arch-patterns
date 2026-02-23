package com.internetbank.common.dtos.page;

import com.internetbank.common.enums.SortOption;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Parameter;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.web.bind.annotation.RequestParam;

@ParameterObject
@Schema(description = "Параметры пагинации и сортировки",
        example = "{\"page\":0,\"size\":10,\"sortBy\":\"id\",\"sortDir\":\"ASC\"}")
public record PageRequestParams(
        @Parameter(description = "Page number (zero-based)", schema = @Schema(defaultValue = "0", example = "0"))
        @RequestParam(name = "page", defaultValue = "0") int page,

        @Parameter(description = "Number of items per page", schema = @Schema(defaultValue = "10", example = "10"))
        @RequestParam(name = "size", defaultValue = "10") int size,

        @Parameter(description = "Sorting field.", schema = @Schema(defaultValue = "id", example = "id"))
        @RequestParam(name = "sortBy", defaultValue = "id") String sortBy,

        @Parameter(description = "Sorting direction", schema = @Schema(defaultValue = "ASC", example = "ASC", implementation = SortOption.class))
        @RequestParam(name = "sortDir", defaultValue = "ASC") SortOption sortDir
) { }

