import { describe, expect, it, vi } from "vitest";

import { endpoints } from "../../../../endpoints";
import type { ApiRequest } from "../../../types";
import {
  DecoponSessionStatus,
  Locale,
  LogSource,
} from "@/scripts/types";

const MOCK_USER_ID = 101;

const {
  transformTagListResponseMock,
  transformTagResponseMock,
  transformOptionalTagResponseMock,
  transformDeleteTagsResponseMock,
  transformLogListResponseMock,
  transformLogResponseMock,
  transformDecoponSessionListResponseMock,
  transformDecoponSessionResponseMock,
  transformDeleteDecoponSessionResponseMock,
  transformCycleCountResponseMock,
  transformProfileMetaResponseMock,
  transformUserMock,
  transformVoidResponseMock,
  transformPreferenceResponseMock,
} = vi.hoisted(() => ({
  transformTagListResponseMock: vi.fn(),
  transformTagResponseMock: vi.fn(),
  transformOptionalTagResponseMock: vi.fn(),
  transformDeleteTagsResponseMock: vi.fn(),
  transformLogListResponseMock: vi.fn(),
  transformLogResponseMock: vi.fn(),
  transformDecoponSessionListResponseMock: vi.fn(),
  transformDecoponSessionResponseMock: vi.fn(),
  transformDeleteDecoponSessionResponseMock: vi.fn(),
  transformCycleCountResponseMock: vi.fn(),
  transformProfileMetaResponseMock: vi.fn(),
  transformUserMock: vi.fn(),
  transformVoidResponseMock: vi.fn(),
  transformPreferenceResponseMock: vi.fn(),
}));

vi.mock("../shared", async () => {
  const actual = await vi.importActual<typeof import("../shared")>(
    "../shared",
  );

  return {
    ...actual,
    getAuthenticatedUserId: vi.fn(() => MOCK_USER_ID),
    transformTagListResponse: transformTagListResponseMock,
    transformTagResponse: transformTagResponseMock,
    transformOptionalTagResponse: transformOptionalTagResponseMock,
    transformDeleteTagsResponse: transformDeleteTagsResponseMock,
    transformLogListResponse: transformLogListResponseMock,
    transformLogResponse: transformLogResponseMock,
    transformDecoponSessionListResponse:
      transformDecoponSessionListResponseMock,
    transformDecoponSessionResponse: transformDecoponSessionResponseMock,
    transformDeleteDecoponSessionResponse:
      transformDeleteDecoponSessionResponseMock,
    transformCycleCountResponse: transformCycleCountResponseMock,
    transformProfileMetaResponse: transformProfileMetaResponseMock,
    transformUser: transformUserMock,
    transformVoidResponse: transformVoidResponseMock,
    transformPreferenceResponse: transformPreferenceResponseMock,
  };
});

import { ipcCommandMatchers } from "./index";
import {
  transformCycleCountResponse,
  transformDecoponSessionListResponse,
  transformDecoponSessionResponse,
  transformDeleteDecoponSessionResponse,
  transformLogListResponse,
  transformLogResponse,
  transformOptionalTagResponse,
  transformPreferenceResponse,
  transformProfileMetaResponse,
  transformTagListResponse,
  transformTagResponse,
  transformUser,
  transformVoidResponse,
} from "../shared";

function findCommand(request: ApiRequest) {
  for (const matcher of ipcCommandMatchers) {
    const command = matcher(request);
    if (command) {
      return command;
    }
  }
  return null;
}

describe("ipcCommandMatchers", () => {
  it("maps GET /tags to list_tags", () => {
    const command = findCommand({ method: "get", url: endpoints.tags.index });
    expect(command).not.toBeNull();
    expect(command?.command).toBe("list_tags");
    expect(command?.payload).toEqual({ request: { userId: MOCK_USER_ID } });
    expect(command?.transform).toBe(transformTagListResponse);
  });

  it("maps POST /tags to create_tag", () => {
    const request: ApiRequest = {
      method: "post",
      url: endpoints.tags.store,
      data: { name: "Work" },
    };
    const command = findCommand(request);
    expect(command?.command).toBe("create_tag");
    expect(command?.payload).toEqual({
      request: { userId: MOCK_USER_ID, name: "Work" },
    });
    expect(command?.transform).toBe(transformTagResponse);
  });

  it("maps POST /tags/relation to attach_tag_to_task", () => {
    const request: ApiRequest = {
      method: "post",
      url: endpoints.tags.relation,
      data: { task_id: 24, name: "Urgent" },
    };
    const command = findCommand(request);
    expect(command?.command).toBe("attach_tag_to_task");
    expect(command?.payload).toEqual({
      request: { userId: MOCK_USER_ID, taskId: 24, name: "Urgent" },
    });
    expect(command?.transform).toBe(transformTagResponse);
  });

  it("maps DELETE /tags/relation to detach_tag_from_task", () => {
    const request: ApiRequest = {
      method: "delete",
      url: endpoints.tags.relationDestroy,
      data: { task_id: 11, name: "Focus" },
    };
    const command = findCommand(request);
    expect(command?.command).toBe("detach_tag_from_task");
    expect(command?.payload).toEqual({
      request: { userId: MOCK_USER_ID, taskId: 11, name: "Focus" },
    });
    expect(command?.transform).toBe(transformOptionalTagResponse);
  });

  it("maps DELETE /tags/multiple to delete_tags", () => {
    const request: ApiRequest = {
      method: "delete",
      url: endpoints.tags.destroyMany,
      data: { tag_ids: [1, 2, "3"] },
    };
    const command = findCommand(request);
    expect(command?.command).toBe("delete_tags");
    expect(command?.payload).toEqual({
      request: { userId: MOCK_USER_ID, tagIds: [1, 2, 3] },
    });
    expect(command?.transform).toBe(transformDeleteTagsResponseMock);
  });

  it("maps GET /logs to list_logs", () => {
    const command = findCommand({ method: "get", url: endpoints.logs.index });
    expect(command?.command).toBe("list_logs");
    expect(command?.payload).toEqual({
      request: { userId: MOCK_USER_ID },
    });
    expect(command?.transform).toBe(transformLogListResponse);
  });

  it("maps POST /logs to create_log", () => {
    const request: ApiRequest = {
      method: "post",
      url: endpoints.logs.store,
      data: {
        content: "Session started",
        source: LogSource.System,
        task_id: 7,
      },
    };
    const command = findCommand(request);
    expect(command?.command).toBe("create_log");
    expect(command?.payload).toEqual({
      request: {
        userId: MOCK_USER_ID,
        content: "Session started",
        source: LogSource.System,
        taskId: 7,
      },
    });
    expect(command?.transform).toBe(transformLogResponse);
  });

  it("maps GET /logs/task/:id to list_logs_by_task", () => {
    const url = endpoints.logs.task(55);
    const command = findCommand({ method: "get", url });
    expect(command?.command).toBe("list_logs_by_task");
    expect(command?.payload).toEqual({
      request: { userId: MOCK_USER_ID, taskId: 55 },
    });
    expect(command?.transform).toBe(transformLogListResponse);
  });

  it("maps GET /decopon_sessions to list_decopon_sessions", () => {
    const command = findCommand({
      method: "get",
      url: endpoints.decoponSessions.index,
    });
    expect(command?.command).toBe("list_decopon_sessions");
    expect(command?.payload).toEqual({
      request: { userId: MOCK_USER_ID },
    });
    expect(command?.transform).toBe(transformDecoponSessionListResponse);
  });

  it("maps POST /decopon_sessions to create_decopon_session", () => {
    const startedAt = new Date().toISOString();
    const endedAt = new Date().toISOString();
    const request: ApiRequest = {
      method: "post",
      url: endpoints.decoponSessions.store,
      data: {
        status: DecoponSessionStatus.InProgress,
        started_at: startedAt,
        ended_at: endedAt,
      },
    };
    const command = findCommand(request);
    expect(command?.command).toBe("create_decopon_session");
    expect(command?.payload).toEqual({
      request: {
        userId: MOCK_USER_ID,
        status: DecoponSessionStatus.InProgress,
        startedAt,
        endedAt,
      },
    });
    expect(command?.transform).toBe(transformDecoponSessionResponse);
  });

  it("maps GET /decopon_sessions/:id to get_decopon_session", () => {
    const url = endpoints.decoponSessions.show(88);
    const command = findCommand({ method: "get", url });
    expect(command?.command).toBe("get_decopon_session");
    expect(command?.payload).toEqual({
      request: { id: 88, userId: MOCK_USER_ID },
    });
    expect(command?.transform).toBe(transformDecoponSessionResponse);
  });

  it("maps PUT /decopon_sessions/:id to update_decopon_session", () => {
    const url = endpoints.decoponSessions.update(12);
    const request: ApiRequest = {
      method: "put",
      url,
      data: {
        status: DecoponSessionStatus.Completed,
      },
    };
    const command = findCommand(request);
    expect(command?.command).toBe("update_decopon_session");
    expect(command?.payload).toEqual({
      request: {
        id: 12,
        userId: MOCK_USER_ID,
        status: DecoponSessionStatus.Completed,
      },
    });
    expect(command?.transform).toBe(transformDecoponSessionResponse);
  });

  it("maps DELETE /decopon_sessions/:id to delete_decopon_session", () => {
    const url = endpoints.decoponSessions.destroy(13);
    const command = findCommand({ method: "delete", url });
    expect(command?.command).toBe("delete_decopon_session");
    expect(command?.payload).toEqual({
      request: { id: 13, userId: MOCK_USER_ID },
    });
    expect(command?.transform).toBe(transformDeleteDecoponSessionResponse);
  });

  it("maps GET /decopon_sessions/cycles to count_decopon_cycles", () => {
    const command = findCommand({
      method: "get",
      url: `${endpoints.decoponSessions.cycles}?date=2024-01-01`,
    });
    expect(command?.command).toBe("count_decopon_cycles");
    expect(command?.payload).toEqual({
      request: { userId: MOCK_USER_ID, date: "2024-01-01" },
    });
    expect(command?.transform).toBe(transformCycleCountResponse);
  });

  it("maps GET /profiles to get_profile", () => {
    const command = findCommand({ method: "get", url: endpoints.profiles.show });
    expect(command?.command).toBe("get_profile");
    expect(command?.payload).toEqual({
      request: { userId: MOCK_USER_ID },
    });
    expect(command?.transform).toBe(transformProfileMetaResponse);
  });

  it("maps PUT /profiles to update_profile", () => {
    const request: ApiRequest = {
      method: "put",
      url: endpoints.profiles.update,
      data: { name: "Alice" },
    };
    const command = findCommand(request);
    expect(command?.command).toBe("update_profile");
    expect(command?.payload).toEqual({
      command: {
        userId: MOCK_USER_ID,
        request: { name: "Alice" },
      },
    });
    expect(command?.transform).toBe(transformUser);
  });

  it("maps PUT /profiles/password to update_profile_password", () => {
    const request: ApiRequest = {
      method: "put",
      url: endpoints.profiles.passwordUpdate,
      data: { current_password: "old", password: "new" },
    };
    const command = findCommand(request);
    expect(command?.command).toBe("update_profile_password");
    expect(command?.payload).toEqual({
      command: {
        userId: MOCK_USER_ID,
        request: { currentPassword: "old", password: "new" },
      },
    });
    expect(command?.transform).toBe(transformVoidResponse);
  });

  it("maps DELETE /profiles to delete_profile", () => {
    const request: ApiRequest = {
      method: "delete",
      url: endpoints.profiles.destroy,
      data: { password: "secret" },
    };
    const command = findCommand(request);
    expect(command?.command).toBe("delete_profile");
    expect(command?.payload).toEqual({
      command: {
        userId: MOCK_USER_ID,
        request: { password: "secret" },
      },
    });
    expect(command?.transform).toBe(transformVoidResponse);
  });

  it("maps PUT /preferences to update_preferences", () => {
    const request: ApiRequest = {
      method: "put",
      url: endpoints.preferences.update,
      data: { work_time: 45, break_time: 15, locale: Locale.JAPANESE },
    };
    const command = findCommand(request);
    expect(command?.command).toBe("update_preferences");
    expect(command?.payload).toEqual({
      command: {
        userId: MOCK_USER_ID,
        request: {
          workTime: 45,
          breakTime: 15,
          locale: Locale.JAPANESE,
        },
      },
    });
    expect(command?.transform).toBe(transformPreferenceResponse);
  });
});
