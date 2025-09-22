import type {
  ApiRequestData,
  AuthResponse,
  StatusResponse,
  User,
  UserResponse,
} from "@/scripts/types";
import { authStorage } from "../../lib/authStorage";
import { tokenStorage } from "../../lib/tokenStorage";
import { endpoints } from "../endpoints";
import { callApi } from "../httpClient";

export const AuthService = {
  getUser(): Promise<User> {
    return callApi<UserResponse>("get", endpoints.auth.getUser).then(
      (res) => res.user,
    );
  },
  login(data: ApiRequestData): Promise<AuthResponse> {
    return callApi<AuthResponse>("post", endpoints.auth.login, data).then(
      (res) => {
        const token = res.token;
        if (token) {
          tokenStorage.setToken(token);
        }
        return res;
      },
    );
  },
  logout(): Promise<void> {
    return callApi<void>("delete", endpoints.auth.logout).then(() => {
      tokenStorage.removeToken();
      authStorage.clear();
    });
  },
  register(data: ApiRequestData): Promise<UserResponse> {
    return callApi<UserResponse>("post", endpoints.auth.register, data);
  },
  verifyEmail(token: string): Promise<AuthResponse> {
    return callApi<AuthResponse>("get", endpoints.auth.verifyEmail(token)).then(
      (res) => {
        const jwt = res.token;
        if (jwt) {
          tokenStorage.setToken(jwt);
        }
        return res;
      },
    );
  },
  forgotPassword(data: ApiRequestData): Promise<void> {
    return callApi<void>("post", endpoints.auth.forgotPassword, data);
  },
  resetPassword(data: ApiRequestData): Promise<void> {
    return callApi<void>("post", endpoints.auth.resetPassword, data);
  },
  confirmPassword(data: ApiRequestData): Promise<StatusResponse> {
    return callApi<StatusResponse>(
      "post",
      endpoints.auth.confirmPassword,
      data,
    );
  },
  resendVerification(data: ApiRequestData): Promise<StatusResponse> {
    return callApi<StatusResponse>(
      "post",
      endpoints.auth.resendVerification,
      data,
    );
  },
};
