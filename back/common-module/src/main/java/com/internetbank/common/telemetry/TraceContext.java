package com.internetbank.common.telemetry;

public final class TraceContext {

    public static final String HEADER_NAME = "X-Trace-Id";
    public static final String MDC_KEY = "traceId";
    public static final String REQUEST_ATTRIBUTE = TraceContext.class.getName() + ".traceId";

    private TraceContext() {
    }
}
