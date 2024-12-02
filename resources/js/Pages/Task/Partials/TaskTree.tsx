import {
    FlatTree,
    FlatTreeItem,
    TreeItemLayout,
    HeadlessFlatTreeItemProps,
    useHeadlessFlatTree_unstable,
} from "@fluentui/react-components";

const SELECTION_MODE = "multiselect"; // change to "single" for single selection

type CustomItem = HeadlessFlatTreeItemProps & { content: string };

const items: CustomItem[] = [
    { value: "1", content: "Level 1, item 1" },
    { value: "1-1", parentValue: "1", content: "Level 2, item 1" },
    { value: "1-2", parentValue: "1", content: "Level 2, item 2" },
    { value: "2", content: "Level 1, item 2" },
    { value: "2-1", parentValue: "2", content: "Level 2, item 1" },
    { value: "2-1-1", parentValue: "2-1", content: "Level 3, item 1" },
    { value: "2-2", parentValue: "2", content: "Level 2, item 2" },
    { value: "2-2-1", parentValue: "2-2", content: "Level 3, item 1" },
    { value: "2-2-2", parentValue: "2-2", content: "Level 3, item 2" },
    { value: "3", content: "Level 1, item 3" },
];

const TaskTree = () => {
    const flatTree = useHeadlessFlatTree_unstable(items, {
        defaultOpenItems: ["1", "2", "2-1", "2-2"],
        defaultCheckedItems: ["1-2"],
        selectionMode: SELECTION_MODE,
    });

    return (
        <FlatTree {...flatTree.getTreeProps()} aria-label="Selection">
            {Array.from(flatTree.items(), (flatTreeItem) => {
                const { content, ...treeItemProps } =
                    flatTreeItem.getTreeItemProps();
                return (
                    <FlatTreeItem {...treeItemProps} key={flatTreeItem.value}>
                        <TreeItemLayout>{content}</TreeItemLayout>
                    </FlatTreeItem>
                );
            })}
        </FlatTree>
    );
};

export default TaskTree;
