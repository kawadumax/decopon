import { logger } from "@/scripts/lib/utils";

const DemoCautionBase = ({
  header,
  content,
  account,
}: {
  header: string;
  content: string;
  account?: { id: string; password: string };
}) => {
  if (import.meta.env.VITE_APP_ENV === "production") return;
  return (
    <div className="mb-4 font-light text-sm">
      <h4 className="block font-medium text-fg text-sm dark:text-fg-secondary ">
        {header}
      </h4>
      <p>{content}</p>
      {account && <p>ID: {account.id}</p>}
      {account && <p>PW: {account.password}</p>}
    </div>
  );
};

export const DemoCaution = ({
  header,
  content,
}: { header: string; content: string }) => {
  return <DemoCautionBase header={header} content={content} />;
};

export const DemoCautionWithAccount = ({
  header,
  content,
}: { header: string; content: string }) => {
  const env = import.meta.env;
  logger(env);
  return (
    <DemoCautionBase
      header={header}
      content={content}
      account={{
        id: env.VITE_GUEST_EMAIL,
        password: env.VITE_GUEST_PASSWORD,
      }}
    />
  );
};
