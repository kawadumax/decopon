import { currentTagAtom } from "@/Lib/atoms";
import { useAtomValue } from "jotai";

export const TagHeader = () => {
	const currentTag = useAtomValue(currentTagAtom);
	return (
		<h2 className="font-bold text-2xl sticky p-4 top-0">
			{currentTag ? `#${currentTag.name}` : "All Tasks"}
		</h2>
	);
};
