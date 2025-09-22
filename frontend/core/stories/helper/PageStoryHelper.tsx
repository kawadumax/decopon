import type { Meta, StoryFn } from "@storybook/react";
import { http, HttpResponse } from "msw";
import { RouterDecorator } from "../../.storybook/lib/withRouterDecorator";
import { baseURL } from "../../src/scripts/api/httpClient";
import { queryClient } from "../../src/scripts/queries";

const baseUrl = baseURL.endsWith("/api") ? baseURL : `${baseURL}/api`;
const testUser = {
  user: {
    id: 1,
    name: "test user",
    email: "test@example.com",
  },
};

export const pageMswHandlers = [
  http.get(`${baseUrl}/tags`, () => {
    return HttpResponse.json({
      tags: [
        { id: 1, name: "tag1" },
        { id: 2, name: "tag2" },
      ],
    });
  }),
  http.get(`${baseUrl}/tasks`, () => {
    return HttpResponse.json({
      tasks: [
        { id: 1, title: "task1", parent_task_id: null },
        { id: 2, title: "task2", parent_task_id: null },
        { id: 3, title: "task2-1", parent_task_id: 2 },
      ],
    });
  }),
  http.get(`${baseUrl}/get-user`, () => {
    return HttpResponse.json({
      auth: {
        user: testUser.user,
      },
    });
  }),
];

export const pageDefaultBehavior = {
  parameters: {
    msw: {
      handlers: pageMswHandlers,
    },
  },
  loaders: [
    async () => {
      queryClient.setQueryDefaults(["auth"], {
        staleTime: Number.POSITIVE_INFINITY, // 常にfresh扱い
        refetchOnMount: false, // マウント時にrefetchしない
        refetchOnReconnect: false, // 再接続時にrefetchしない
        refetchOnWindowFocus: false, // ウィンドウフォーカス時にrefetchしない
        gcTime: Number.POSITIVE_INFINITY, // キャッシュを無限に保持
        retry: false, // エラー時にリトライしない
      });
      await queryClient.setQueryData(["auth"], {
        user: testUser.user,
      });
    },
  ],
  decorators: [RouterDecorator],
};

export const pageMetaSettings = <T,>(): Partial<Meta<T>> => ({
  decorators: [
    (Story: StoryFn) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
});
