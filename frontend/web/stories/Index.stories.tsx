import Authenticated from "@/layouts/AuthenticatedLayout";
import Index from "@pages/task/Index";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { http, HttpResponse } from "msw";

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
};

const queryClient = new QueryClient();

const meta: Meta<typeof Index> = {
  title: "Pages/Tasks/Index",
  component: Index,
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "mobile",
    },
  },
  decorators: [
    (Story) => (
      <div className="h-screen">
        <QueryClientProvider client={queryClient}>
          <JotaiProvider>
            <Authenticated>
              <Story />
            </Authenticated>
          </JotaiProvider>
        </QueryClientProvider>
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Index>;

export const Default: Story = {
  render: () => <Index />,
};
