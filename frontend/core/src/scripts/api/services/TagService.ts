import { endpoints } from "../endpoints";
import { callApi } from "../httpClient";
import type { ApiRequestData, Tag } from "@/scripts/types";

export const TagService = {
  index(): Promise<Tag[]> {
    return callApi<Tag[]>("get", endpoints.tags.index);
  },
  store(data: ApiRequestData): Promise<Tag> {
    return callApi<Tag>("post", endpoints.tags.store, data, {
      toast: { success: "api.tag.store" },
    });
  },
  relation(data: ApiRequestData): Promise<Tag> {
    return callApi<Tag>("post", endpoints.tags.relation, data, {
      toast: {
        success: "api.tag.storeRelation",
        error: "api.tag.storeRelation",
      },
    });
  },
  relationDestroy(data: ApiRequestData): Promise<Tag | null> {
    return callApi<Tag | null>(
      "delete",
      endpoints.tags.relationDestroy,
      data,
      {
        toast: {
          success: "api.tag.destroyRelation",
          error: "api.tag.destroyRelation",
        },
      },
    );
  },
  destroyMany(data: ApiRequestData): Promise<void> {
    return callApi<void>("delete", endpoints.tags.destroyMany, data, {
      toast: {
        success: "api.tag.destroyMultiple",
        error: "api.tag.destroyMultiple",
      },
    });
  },
};
