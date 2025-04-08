import { queryClient } from "@/lib/queryClient";
import Index from "@pages/task/Index";
import type { Meta, StoryObj } from "@storybook/react";
import { http, HttpResponse } from "msw";
import { RouterDecorator } from "../.storybook/lib/withRouterDecorator";

const baseUrl = "http://localhost:8000/api";

export const SuccessBehavior = {
  parameters: {
    msw: {
      handlers: [
        http.get(`${baseUrl}/tags`, () => {
          return HttpResponse.json({
            tags: [
              {
                id: 1,
                name: "tag1",
              },
              {
                id: 2,
                name: "tag2",
              },
            ],
          });
        }),
        http.get(`${baseUrl}/tasks`, () => {
          return HttpResponse.json({
            tasks: [
              {
                id: 1,
                title: "task1",
              },
              {
                id: 2,
                title: "task2",
              },
            ],
          });
        }),
        http.get(`${baseUrl}/get-user`, () => {
          return HttpResponse.json({
            auth: {
              user: {
                id: 1,
                name: "test user",
              },
            },
          });
        }),
      ],
    },
  },
  loaders: [
    async () => {
      await queryClient.setQueryData(["auth"], {
        user: {
          id: 1,
          name: "test user",
        },
      });
    },
  ],
};

const meta: Meta<typeof Index> = {
  title: "Pages/Tasks/Index",
  component: Index,
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "mobile",
    },
  },
  decorators: [RouterDecorator],
};

export default meta;

type Story = StoryObj<typeof Index>;

export const Default: Story = {};
