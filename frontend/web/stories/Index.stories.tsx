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
            firstName: "Neil",
            lastName: "Maverick",
          });
        }),
        http.get(`${baseUrl}/tasks`, () => {
          return HttpResponse.json({
            firstName: "Neil",
            lastName: "Maverick",
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
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <Story />
        </JotaiProvider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Index>;

export const Default: Story = {
  render: () => <Index />,
};
