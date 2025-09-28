import { endpoints } from "../../../../endpoints";
import {
  ensureRecord,
  getPathname,
  transformLoginResponse,
} from "../shared";

import type { IpcCommandMatcher } from "./types";

const matchLoginRequest: IpcCommandMatcher = (request) => {
  if (request.method !== "post") {
    return null;
  }

  if (getPathname(request.url) !== endpoints.auth.login) {
    return null;
  }

  const payload = ensureRecord(request.data, "email", "password");

  return {
    command: "login",
    payload: {
      request: {
        email: String(payload.email ?? ""),
        password: String(payload.password ?? ""),
      },
    },
    transform: transformLoginResponse,
  };
};

export const authCommandMatchers: IpcCommandMatcher[] = [matchLoginRequest];
