import { api } from "./client";
import type {
  RecentTelemetryErrorResponse,
  TelemetrySource,
  TelemetrySummaryResponse,
  TelemetryTimelinePointResponse,
} from "@/types";

interface MonitoringFilters {
  serviceName?: string;
  source?: TelemetrySource;
  from?: string;
  to?: string;
}

export const monitoringApi = {
  getSummary(filters: MonitoringFilters) {
    return api.get<TelemetrySummaryResponse>("/api/v1/monitoring/summary", {
      params: filters,
    });
  },

  getTimeline(filters: MonitoringFilters & { bucketMinutes?: number }) {
    return api.get<TelemetryTimelinePointResponse[]>("/api/v1/monitoring/timeline", {
      params: filters,
    });
  },

  getRecentErrors(
    filters: Pick<MonitoringFilters, "serviceName" | "source"> & { limit?: number }
  ) {
    return api.get<RecentTelemetryErrorResponse[]>(
      "/api/v1/monitoring/errors/recent",
      {
        params: filters,
      }
    );
  },
};
