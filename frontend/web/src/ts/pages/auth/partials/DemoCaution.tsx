export const DemoCaution = ({
  header,
  content,
}: { header: string; content: string }) => {
  if (import.meta.env.VITE_APP_ENV === "production") return;

  return (
    <div className="mb-4 font-light text-sm">
      <h4 className="block font-medium text-gray-700 text-sm dark:text-gray-300 ">
        {header}
      </h4>
      <p>{content}</p>
    </div>
  );
};
