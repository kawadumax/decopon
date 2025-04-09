import { Dashboard } from "@/pages/Dashboard";
import type { Meta, StoryObj } from "@storybook/react";
import {
  pageMetaSettings,
  pageSuccessBehavior,
} from "./helper/PageStoryHelper";

const meta: Meta<typeof Dashboard> = {
  title: "Pages/Dashboard",
  component: Dashboard,
  ...pageMetaSettings,
};

export default meta;

type Story = StoryObj<typeof Dashboard>;

export const Default: Story = {
  ...pageSuccessBehavior,
};
