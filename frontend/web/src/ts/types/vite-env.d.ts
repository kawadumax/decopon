/// <reference types="vite/client" />

//SVGの読み込み
/// <reference types="vite-plugin-svgr/client" />
declare module "*.svg?react" {
  import React = require("react");
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
