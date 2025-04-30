import Index from "@pages/log/Index";
import type { Meta, StoryObj } from "@storybook/react";
import {
  pageDefaultBehavior,
  pageMetaSettings,
} from "./helper/PageStoryHelper";

const meta: Meta<typeof Index> = {
  title: "Pages/Logs/Index",
  component: Index,
  ...pageMetaSettings(),
};

export default meta;

type Story = StoryObj<typeof Index>;

export const Default: Story = {
  ...pageDefaultBehavior,
};
