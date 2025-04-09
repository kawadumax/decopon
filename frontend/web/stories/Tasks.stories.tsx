import Index from "@pages/task/Index";
import type { Meta, StoryObj } from "@storybook/react";
import {
  pageMetaSettings,
  pageSuccessBehavior,
} from "./helper/PageStoryHelper";

const meta: Meta<typeof Index> = {
  title: "Pages/Tasks/Index",
  component: Index,
  ...pageMetaSettings,
};

export default meta;

type Story = StoryObj<typeof Index>;

export const Default: Story = {
  ...pageSuccessBehavior,
};
