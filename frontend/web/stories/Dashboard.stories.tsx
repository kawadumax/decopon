import { queryClient } from "@/lib/queryClient";
import { Dashboard } from "@/pages/Dashboard";
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
          email: "test@example.com",
        },
      });
    },
  ],
  decorators: [RouterDecorator],
};

const meta: Meta<typeof Dashboard> = {
  title: "Pages/Dashboard",
  component: Dashboard,
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "mobile",
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Dashboard>;

export const Default: Story = {};
