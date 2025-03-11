import { TagHeader } from "@/components/TagHeader";
import { TaskTree } from "@/components/TaskTree";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { tagsAtom } from "@/lib/atoms";
import type { PageProps } from "@/types";
import type { Tag } from "@/types";
import { Head } from "@inertiajs/react";
import { useAtom } from "jotai";
import { useEffect } from "react";
import Split from "react-split";
import { TagTable } from "./partials/TagTable";
import { TagTools } from "./partials/TagTools";
import { useTranslation } from "react-i18next";

export default function Index(
	props: PageProps<{
		tags: Tag[];
	}>,
) {
	const { t } = useTranslation();
	const [tags, setTags] = useAtom(tagsAtom);
	useEffect(() => {
		setTags(props.tags);
	}, [props.tags, setTags]);

	return (
		<AuthenticatedLayout>
			<Head title={t("tag.title")} />

			<Split
				className="flex flex-row min-h-full max-h-full bg-white"
				sizes={[50, 50]} // 白銀比を元にした比率
				gutterSize={1}
				gutter={() => {
					const gutterElement = document.createElement("div");
					gutterElement.className =
						"w-2 bg-stone-50 hover:cursor-col-resize hover:w-2 hover:bg-amber-400 transition-all delay-100 duration-300 ease-in-out";
					return gutterElement;
				}}
				// 元のgutterのスタイルを削除
				gutterStyle={() => ({})}
			>
				<div className="p-8 py-2">
					<TagTools />
					<TagTable tags={tags} />
				</div>
				<div>
					<TagHeader />
					<TaskTree />
				</div>
			</Split>
		</AuthenticatedLayout>
	);
}
