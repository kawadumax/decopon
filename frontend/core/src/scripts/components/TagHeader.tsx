import { currentTagAtom } from "@lib/atoms";
import { useAtomValue } from "jotai";

export const TagHeader = () => {
  const currentTag = useAtomValue(currentTagAtom);
  return (
    <h2 className="sticky top-0 p-4 font-bold text-2xl">
      {currentTag ? `#${currentTag.name}` : "All Tasks"}
    </h2>
  );
};
