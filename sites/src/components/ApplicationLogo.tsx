import type { SVGAttributes } from "react";
import { ReactComponent as Logo } from "./decopon-logo.svg?react";

export function ApplicationLogo(props: SVGAttributes<SVGElement>) {
  return <Logo {...props} />;
}
