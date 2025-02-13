import { Button } from "@/Components/ui/button";
import { tagsAtom } from "@/Lib/atoms";
import { useAtom } from "jotai";
import { Minus, Plus } from "@mynaui/icons-react";
import { useApi } from "@/Hooks/useApi";

export const TagTools = () => {
    const [, setTags] = useAtom(tagsAtom);
    const api = useApi();

    const handleAddNewTag = () => {
        const tagTemplate = {
            name: "",
        };

        api.post(route("api.tags.store"), tagTemplate, (response) => {
            // setTags((prev) => [...prev, response.data.tagk]);
            // 今は何もしない
            console.log("tags.store called");
        });
    };

    const handleDeleteTag = () => {};

    return (
        <div className="flex justify-start gap-4 my-4">
            <Button
                variant={"destructive"}
                className="bg-red-600"
                onClick={handleDeleteTag}
            >
                Delete
            </Button>
            {/* <Button onClick={handleAddNewTag}>
                <Plus />
            </Button> */}
        </div>
    );
};
