// SVGの読み込み
declare module "*.svg?react" {
  import React = require("react");
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// Worker を型定義
declare module "*?worker" {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}
declare module "*?worker&inline" {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

// biome-ignore lint/correctness/noUnusedVariables: 型定義のため
interface ImportMetaEnv {
  readonly VITE_APP_ENV: string;
  readonly VITE_LOG_LEVEL?: "debug" | "info" | "warn" | "error";
  readonly VITE_APP_NAME: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_BACKEND?: string;
  readonly VITE_GUEST_EMAIL: string;
  readonly VITE_GUEST_PASSWORD: string;
  readonly VITE_APP_SINGLE_USER_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
