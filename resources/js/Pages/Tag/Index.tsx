import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { tagsAtom } from "@/Lib/atoms";
import { PageProps } from "@/types";
import { Tag } from "@/types";
import { Head } from "@inertiajs/react";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import Split from "react-split";
import { TagTable } from "./Partials/TagTable";
import { TagTools } from "./Partials/TagTools";

export default function Index(
    props: PageProps<{
        tags: Tag[];
    }>
) {
    const tagContainerRef = useRef<HTMLUListElement>(null);
    const [tags, setTags] = useAtom(tagsAtom);
    useEffect(() => {
        setTags(props.tags);
    }, [props.tags]);

    return (
        <AuthenticatedLayout>
            <Head title="All Tags" />

            <Split
                className="flex flex-row min-h-full max-h-full bg-white"
                sizes={[50, 50]} // 白銀比を元にした比率
                gutterSize={1}
                gutter={() => {
                    const gutterElement = document.createElement("div");
                    gutterElement.className = `w-2 bg-stone-50 hover:cursor-col-resize hover:w-2 hover:bg-amber-400 transition-all delay-100 duration-300 ease-in-out`;
                    return gutterElement;
                }}
                // 元のgutterのスタイルを削除
                gutterStyle={() => ({})}
            >
                <div className="p-8 py-2">
                    <TagTools></TagTools>
                    <TagTable tags={tags}></TagTable>
                </div>
                <div>選んだタグのタスクの一覧が出る？？？</div>
            </Split>
        </AuthenticatedLayout>
    );
}
