import { endpoints } from "../endpoints";
import { callApi } from "../client";
import type {
  ApiRequestData,
  PreferenceResponse,
  ProfileResponse,
  User,
} from "@/scripts/types";

export const ProfileService = {
  getProfile(): Promise<ProfileResponse> {
    return callApi<ProfileResponse>("get", endpoints.profiles.show);
  },
  updateProfile(data: ApiRequestData): Promise<User> {
    return callApi<User>("put", endpoints.profiles.update, data, {
      toast: {
        success: "api.preference.update",
        error: "api.preference.update",
      },
    });
  },
  updatePreference(data: ApiRequestData): Promise<PreferenceResponse> {
    return callApi<PreferenceResponse>(
      "put",
      endpoints.preferences.update,
      data,
      {
        toast: {
          success: "api.preference.update",
          error: "api.preference.update",
        },
      },
    );
  },
  updatePassword(data: ApiRequestData): Promise<void> {
    return callApi<void>("put", endpoints.profiles.passwordUpdate, data, {
      toast: {
        success: "api.preference.updatePassword",
        error: "api.preference.updatePassword",
      },
    });
  },
  deleteUser(data: ApiRequestData): Promise<void> {
    return callApi<void>("delete", endpoints.profiles.destroy, data, {
      toast: {
        success: "api.preference.destroy",
        error: "api.preference.destroy",
      },
    });
  },
};
