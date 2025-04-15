import { queryClient } from "@/lib/queryClient";
import type { Meta, StoryFn } from "@storybook/react";
import { http, HttpResponse } from "msw";
import { RouterDecorator } from "../../.storybook/lib/withRouterDecorator";

const baseUrl = "http://localhost:8000/api";
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
        { id: 1, title: "task1" },
        { id: 2, title: "task2" },
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
