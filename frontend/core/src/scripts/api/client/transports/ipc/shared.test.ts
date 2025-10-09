import { describe, expect, it } from "vitest";

import { transformProfileMetaResponse } from "./shared";
import { Locale } from "@/scripts/types";

describe("transformProfileMetaResponse", () => {
  it("returns metadata when the response includes profile flags", () => {
    const result = transformProfileMetaResponse({
      mustVerifyEmail: true,
      status: "profile.updated",
    });

    expect(result).toEqual({
      mustVerifyEmail: true,
      status: "profile.updated",
    });
  });

  it("parses the nested user payload when provided", () => {
    const result = transformProfileMetaResponse({
      mustVerifyEmail: true,
      user: {
        id: 42,
        name: "Alice",
        email: "alice@example.com",
        work_time: 45,
        break_time: 15,
        locale: Locale.JAPANESE,
      },
    });

    expect(result).toEqual({
      mustVerifyEmail: true,
      user: {
        id: 42,
        name: "Alice",
        email: "alice@example.com",
        work_time: 45,
        break_time: 15,
        locale: Locale.JAPANESE,
        email_verified_at: undefined,
      },
    });
  });

  it("coerces bare user responses from IPC commands", () => {
    const result = transformProfileMetaResponse({
      id: 7,
      name: "Bob",
      email: "bob@example.com",
      work_time: 50,
      break_time: 10,
      locale: Locale.ENGLISH,
    });

    expect(result).toEqual({
      mustVerifyEmail: false,
      user: {
        id: 7,
        name: "Bob",
        email: "bob@example.com",
        work_time: 50,
        break_time: 10,
        locale: Locale.ENGLISH,
        email_verified_at: undefined,
      },
    });
  });
});
