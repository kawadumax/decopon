import { useTagStore } from "@store/tag";

export const TagHeader = () => {
  const currentTag = useTagStore((s) => s.currentTag);
  return (
    <h2 className="sticky top-0 p-4 font-bold text-2xl">
      {currentTag ? `#${currentTag.name}` : "All Tasks"}
    </h2>
  );
};
