import { Dashboard } from "@/scripts/pages/Dashboard";
import type { Meta, StoryObj } from "@storybook/react";
import {
  pageDefaultBehavior,
  pageMetaSettings,
} from "./helper/PageStoryHelper";

const meta: Meta<typeof Dashboard> = {
  title: "Pages/Dashboard",
  component: Dashboard,
  ...pageMetaSettings(),
};

export default meta;

type Story = StoryObj<typeof Dashboard>;

export const Default: Story = {
  ...pageDefaultBehavior,
};
