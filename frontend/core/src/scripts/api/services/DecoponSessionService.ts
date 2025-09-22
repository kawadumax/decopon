import {
  type ApiRequestData,
  type CycleCount,
  type DecoponSession,
  DecoponSessionStatus,
} from "@/scripts/types";
import { endpoints } from "../endpoints";
import { callApi } from "../httpClient";

export const DecoponSessionService = {
  progressPayload(): ApiRequestData {
    return {
      started_at: new Date().toISOString(),
      ended_at: undefined,
      status: DecoponSessionStatus.InProgress,
    };
  },
  interruptPayload(): ApiRequestData {
    return {
      ended_at: new Date().toISOString(),
      status: DecoponSessionStatus.Interrupted,
    };
  },
  progress(id: number): Promise<DecoponSession> {
    return DecoponSessionService.update(
      id,
      DecoponSessionService.progressPayload(),
    );
  },
  interrupt(id: number): Promise<DecoponSession> {
    return DecoponSessionService.update(
      id,
      DecoponSessionService.interruptPayload(),
    );
  },
  store(data: ApiRequestData): Promise<DecoponSession> {
    return callApi<DecoponSession>(
      "post",
      endpoints.decoponSessions.store,
      data,
      {
        toast: {
          success: "api.decopon_session.store",
          error: "api.decopon_session.store",
        },
      },
    );
  },
  update(id: number, data: ApiRequestData): Promise<DecoponSession> {
    return callApi<DecoponSession>(
      "put",
      endpoints.decoponSessions.update(id),
      data,
      {
        toast: {
          success: "api.decopon_session.update",
          error: "api.decopon_session.update",
        },
      },
    );
  },
  cycles(date: string): Promise<CycleCount> {
    return callApi<CycleCount>(
      "get",
      `${endpoints.decoponSessions.cycles}?date=${date}`,
    );
  },
};
